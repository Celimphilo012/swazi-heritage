import natural from 'natural';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MODEL_PATH = path.join(__dirname, '..', '..', 'ml', 'model.json');

const { PorterStemmer, WordTokenizer, BayesClassifier } = natural;
const tokenizer = new WordTokenizer();

const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','by','with',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','can','may',
  'this','that','these','those','it','its','i','me','my','we','our',
  'you','your','he','she','his','her','they','their',
]);

// Tokenise + stem a piece of text into a list of terms
const tokenise = (text) =>
  tokenizer.tokenize((text || '').toLowerCase())
    .filter(t => t.length > 2 && !STOP.has(t))
    .map(t => PorterStemmer.stem(t));

// Build a term-frequency map for a document
const buildTF = (terms) => {
  const freq = {};
  terms.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const total = terms.length || 1;
  Object.keys(freq).forEach(t => { freq[t] /= total; });
  return freq;
};

// Build IDF table from a list of TF maps
const buildIDF = (tfMaps) => {
  const N = tfMaps.length;
  const df = {};
  tfMaps.forEach(tf => {
    Object.keys(tf).forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(t => { idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; });
  return idf;
};

// Compute TF-IDF vector from TF map + IDF table
const tfidfVector = (tf, idf) => {
  const vec = {};
  Object.keys(tf).forEach(t => { if (idf[t]) vec[t] = tf[t] * idf[t]; });
  return vec;
};

// Document formatters (used later by predictor)
const docText = {
  ceremony: (c) => [c.name, c.month_celebrated, c.description, c.immunology_notes].filter(Boolean).join(' '),
  lineage:  (l) => [l.title, l.era, l.description].filter(Boolean).join(' '),
  clan:     (cl) => [cl.name, cl.lineage_title, cl.royal_connection, cl.founding_era, cl.description].filter(Boolean).join(' '),
  song:     (sg) => [sg.title, sg.ceremony_name, sg.description].filter(Boolean).join(' '),
};

export const trainModel = async (onProgress) => {
  const log = (msg) => { if (onProgress) onProgress(msg); };

  log('Fetching published content from database…');

  const [ceremonies, lineages, clans, songs] = await Promise.all([
    query(`SELECT id, name, description, month_celebrated, immunology_notes
           FROM ceremonies WHERE status = 'published'`),
    query(`SELECT id, title, description, era
           FROM lineage_records WHERE status = 'published'`),
    query(`SELECT cl.id, cl.name, cl.description, cl.royal_connection, cl.founding_era,
                  lr.title AS lineage_title
           FROM clans cl JOIN lineage_records lr ON cl.lineage_id = lr.id`),
    query(`SELECT cs.title, cs.description, c.name AS ceremony_name
           FROM ceremony_songs cs JOIN ceremonies c ON cs.ceremony_id = c.id`),
  ]);

  log(`Loaded: ${ceremonies.length} ceremonies, ${lineages.length} lineage records, ${clans.length} clans, ${songs.length} songs`);

  // ── Build document corpus ───────────────────────────────────────────────────
  const documents = [];
  const addDocs = (rows, type) =>
    rows.forEach(row => {
      const text = docText[type](row);
      const terms = tokenise(text);
      documents.push({ type, data: row, rawText: text, terms });
    });

  addDocs(ceremonies, 'ceremony');
  addDocs(lineages,   'lineage');
  addDocs(clans,      'clan');
  addDocs(songs,      'song');

  log(`Built corpus with ${documents.length} documents. Computing TF-IDF vectors…`);

  // ── TF-IDF ──────────────────────────────────────────────────────────────────
  const tfMaps = documents.map(d => buildTF(d.terms));
  const idf = buildIDF(tfMaps);
  const vectors = tfMaps.map(tf => tfidfVector(tf, idf));
  const vocabSize = Object.keys(idf).length;

  log(`Vocabulary size: ${vocabSize} stemmed terms.`);

  // ── Intent classifier (Naive Bayes) ─────────────────────────────────────────
  log('Training Naive Bayes intent classifier…');
  const classifier = new BayesClassifier(PorterStemmer);

  const intentExamples = {
    ceremony: [
      'when is the ceremony held', 'what happens at the festival',
      'how is the ritual performed', 'who participates in the celebration',
      'what is the meaning of the dance', 'describe the cultural event',
    ],
    lineage: [
      'who are the royal ancestors', 'what is the history of the kingdom',
      'when was the lineage established', 'describe the royal heritage',
      'what era did this originate from', 'tell me about the historical records',
    ],
    clan: [
      'which clan does the family belong to', 'what is the royal connection of the clan',
      'who founded the clan', 'describe the clan traditions',
      'what is the clan name', 'which family lineage',
    ],
    song: [
      'what songs are sung', 'what is the music played',
      'describe the ceremonial chant', 'what are the lyrics',
      'what hymns are used', 'sing the traditional song',
    ],
  };

  Object.entries(intentExamples).forEach(([label, examples]) => {
    examples.forEach(ex => classifier.addDocument(ex, label));
  });

  // Also train on actual content titles/names
  ceremonies.forEach(c => classifier.addDocument(c.name, 'ceremony'));
  lineages.forEach(l => classifier.addDocument(l.title, 'lineage'));
  clans.forEach(cl => classifier.addDocument(cl.name, 'clan'));
  songs.forEach(sg => classifier.addDocument(sg.title, 'song'));

  classifier.train();
  log('Classifier trained.');

  // ── Persist model ────────────────────────────────────────────────────────────
  const model = {
    version: 2,
    trainedAt: new Date().toISOString(),
    stats: {
      ceremonies: ceremonies.length,
      lineages:   lineages.length,
      clans:      clans.length,
      songs:      songs.length,
      total:      documents.length,
      vocab:      vocabSize,
    },
    idf,
    documents: documents.map((d, i) => ({ type: d.type, data: d.data, vector: vectors[i] })),
    classifierState: JSON.parse(JSON.stringify(classifier)),
  };

  fs.writeFileSync(MODEL_PATH, JSON.stringify(model));
  log(`Model saved to disk. Training complete.`);

  return model.stats;
};

export const getModelInfo = () => {
  if (!fs.existsSync(MODEL_PATH)) return null;
  try {
    const { version, trainedAt, stats } = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
    return { version, trainedAt, stats };
  } catch {
    return null;
  }
};
