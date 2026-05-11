import natural from 'natural';
import fs from 'fs';
import { MODEL_PATH } from './trainer.js';

const { PorterStemmer, WordTokenizer, BayesClassifier } = natural;
const tokenizer = new WordTokenizer();

const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','by','with',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','can','may',
  'this','that','these','those','it','its','i','me','my','we','our',
  'you','your','he','she','his','her','they','their',
  'what','whats','when','where','who','which','why','how',
  'tell','explain','describe','about','please','give','show',
]);

const tokenise = (text) =>
  tokenizer.tokenize((text || '').toLowerCase())
    .filter(t => t.length > 2 && !STOP.has(t))
    .map(t => PorterStemmer.stem(t));

const buildTF = (terms) => {
  const freq = {};
  terms.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const total = terms.length || 1;
  Object.keys(freq).forEach(t => { freq[t] /= total; });
  return freq;
};

const tfidfVector = (tf, idf) => {
  const vec = {};
  Object.keys(tf).forEach(t => { if (idf[t]) vec[t] = tf[t] * idf[t]; });
  return vec;
};

const cosineSimilarity = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const av = a[k] || 0, bv = b[k] || 0;
    dot  += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
};

// ── Answer formatters ──────────────────────────────────────────────────────────
const fmt = {
  ceremony: (c) => {
    let out = `• ${c.name}`;
    if (c.month_celebrated) out += ` — celebrated in ${c.month_celebrated}`;
    if (c.description) out += `\n  ${c.description.slice(0, 450)}${c.description.length > 450 ? '…' : ''}`;
    if (c.immunology_notes) out += `\n  Health & ritual notes: ${c.immunology_notes.slice(0, 200)}`;
    return out;
  },
  lineage: (l) => {
    let out = `• ${l.title}`;
    if (l.era) out += ` (${l.era})`;
    if (l.description) out += `\n  ${l.description.slice(0, 450)}${l.description.length > 450 ? '…' : ''}`;
    return out;
  },
  clan: (cl) => {
    let out = `• ${cl.name} clan`;
    if (cl.lineage_title) out += ` (lineage: ${cl.lineage_title})`;
    if (cl.royal_connection) out += `\n  Royal connection: ${cl.royal_connection}`;
    if (cl.founding_era) out += `\n  Founded: ${cl.founding_era}`;
    if (cl.description) out += `\n  ${cl.description.slice(0, 300)}`;
    return out;
  },
  song: (sg) => {
    let out = `• "${sg.title}"`;
    if (sg.ceremony_name) out += ` — sung at ${sg.ceremony_name}`;
    if (sg.description) out += `\n  ${sg.description.slice(0, 200)}`;
    return out;
  },
};

// ── In-memory model cache (cleared on retrain) ────────────────────────────────
let cache = null;

export const clearPredictorCache = () => { cache = null; };

const loadModel = () => {
  if (cache) return cache;
  if (!fs.existsSync(MODEL_PATH)) return null;
  try {
    const model = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
    const classifier = BayesClassifier.restore(model.classifierState, PorterStemmer);
    cache = { ...model, classifier };
    return cache;
  } catch {
    return null;
  }
};

// ── Return raw top docs (used by Ollama RAG) ──────────────────────────────────
export const getRelevantDocs = (question, topN = 3) => {
  const model = loadModel();
  if (!model?.documents?.length) return [];

  const { idf, documents, classifier } = model;

  let intent = null;
  try { intent = classifier.classify(question); } catch {}

  const qTerms = tokenise(question);
  if (!qTerms.length) return [];

  const qVec = tfidfVector(buildTF(qTerms), idf);
  const typeBoost = { ceremony: 1, lineage: 1, clan: 1, song: 1 };
  if (intent) typeBoost[intent] = 1.4;

  return documents
    .map(doc => ({
      type: doc.type,
      data: doc.data,
      score: cosineSimilarity(qVec, doc.vector) * (typeBoost[doc.type] || 1),
    }))
    .filter(d => d.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

// ── Main predict function ──────────────────────────────────────────────────────
export const predictAnswer = (question) => {
  const model = loadModel();
  if (!model?.documents?.length) return null;

  const { idf, documents, classifier } = model;

  // Classify intent to boost relevant document types
  let intent = null;
  try { intent = classifier.classify(question); } catch {}

  // Build query vector
  const qTerms = tokenise(question);
  if (!qTerms.length) return null;

  const qVec = tfidfVector(buildTF(qTerms), idf);

  // Score every document via cosine similarity
  const typeBoost = { ceremony: 1, lineage: 1, clan: 1, song: 1 };
  if (intent) typeBoost[intent] = 1.4; // 40% boost for classified intent

  const scored = documents
    .map(doc => ({
      ...doc,
      score: cosineSimilarity(qVec, doc.vector) * (typeBoost[doc.type] || 1),
    }))
    .filter(d => d.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (!scored.length) return null;

  const sections = scored.map(({ type, data }) => fmt[type]?.(data)).filter(Boolean);
  const confidence = (scored[0].score * 100).toFixed(0);

  const intro = scored.length === 1
    ? `Based on the trained cultural records (${confidence}% match):\n\n`
    : `Based on the trained cultural records (top ${scored.length} results, ${confidence}% top match):\n\n`;

  return {
    answer: intro + sections.join('\n\n'),
    source: 'local',
  };
};
