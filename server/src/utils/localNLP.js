import { query } from '../config/db.js';

// ─── Stop words ───────────────────────────────────────────────────────────────
const STOP = new Set([
  'what', 'whats', 'when', 'where', 'who', 'which', 'why', 'how',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'yet', 'nor',
  'in', 'on', 'at', 'to', 'for', 'of', 'by', 'with', 'from', 'into', 'through',
  'this', 'that', 'these', 'those', 'it', 'its',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'they', 'their',
  'tell', 'explain', 'describe', 'give', 'show', 'know', 'want', 'like', 'please',
  'about', 'some', 'any', 'more', 'there', 'here', 'also',
  'swazi', 'swaziland', 'eswatini',   // too generic to discriminate
]);

// ─── Keyword extraction ───────────────────────────────────────────────────────
const keywords = (text) =>
  text.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));

// ─── Field scoring (weighted keyword hits) ────────────────────────────────────
const scoreField = (text, kws, weight) => {
  if (!text) return 0;
  const lower = text.toLowerCase();
  return kws.reduce((sum, kw) => {
    const hits = (lower.match(new RegExp(`\\b${kw}`, 'g')) || []).length;
    return sum + hits * weight;
  }, 0);
};

const scoreRecord = (record, fieldWeights, kws) =>
  fieldWeights.reduce((total, [field, w]) => total + scoreField(record[field], kws, w), 0);

// ─── Answer formatters ────────────────────────────────────────────────────────
const fmt = {
  ceremony: (c) => {
    let out = `• ${c.name}`;
    if (c.month_celebrated) out += ` — celebrated in ${c.month_celebrated}`;
    if (c.description) out += `\n  ${c.description.slice(0, 400)}${c.description.length > 400 ? '…' : ''}`;
    if (c.immunology_notes) out += `\n  Health notes: ${c.immunology_notes.slice(0, 200)}`;
    return out;
  },
  lineage: (l) => {
    let out = `• ${l.title}`;
    if (l.era) out += ` (${l.era})`;
    if (l.description) out += `\n  ${l.description.slice(0, 400)}${l.description.length > 400 ? '…' : ''}`;
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
  song: (s) => {
    let out = `• "${s.title}"`;
    if (s.ceremony_name) out += ` — sung at ${s.ceremony_name}`;
    if (s.description) out += `\n  ${s.description.slice(0, 200)}`;
    return out;
  },
};

// ─── Intent detection — which section to prioritise ──────────────────────────
const detectIntent = (q) => {
  const lower = q.toLowerCase();
  if (/attire|wear|cloth|dress|imvunulo|outfit|costume/.test(lower)) return 'attire';
  if (/song|sing|music|chant|hymn/.test(lower)) return 'songs';
  if (/clan|family|royal|chief|house|lineage|ancestor|king|queen/.test(lower)) return 'lineage';
  if (/ceremony|festival|celebrate|ritual|tradition/.test(lower)) return 'ceremony';
  return 'all';
};

// ─── Main entry point ─────────────────────────────────────────────────────────
export const answerLocally = async (question) => {
  const kws = keywords(question);

  if (kws.length === 0) {
    return {
      answer: 'Could you ask a more specific question? Try mentioning a ceremony name, clan, or tradition.',
      source: 'local',
    };
  }

  const intent = detectIntent(question);

  // Load relevant tables in parallel
  const [ceremonies, lineages, clans, songs] = await Promise.all([
    query(`SELECT name, description, month_celebrated, immunology_notes
           FROM ceremonies WHERE status = 'published'`),
    query(`SELECT title, description, era FROM lineage_records WHERE status = 'published'`),
    query(`SELECT cl.name, cl.royal_connection, cl.founding_era, cl.description,
                  lr.title AS lineage_title
           FROM clans cl JOIN lineage_records lr ON cl.lineage_id = lr.id`),
    query(`SELECT cs.title, cs.description, c.name AS ceremony_name
           FROM ceremony_songs cs JOIN ceremonies c ON cs.ceremony_id = c.id`),
  ]);

  const results = [];

  // Boost weights based on intent
  const ceremonyBoost = ['all', 'ceremony', 'attire', 'songs'].includes(intent) ? 1 : 0.3;
  const lineageBoost  = ['all', 'lineage'].includes(intent) ? 1 : 0.3;
  const clanBoost     = ['all', 'lineage'].includes(intent) ? 1 : 0.3;
  const songBoost     = ['all', 'songs'].includes(intent) ? 1 : 0.3;

  for (const c of ceremonies) {
    const s = scoreRecord(c, [['name', 4], ['month_celebrated', 2], ['description', 1], ['immunology_notes', 1]], kws) * ceremonyBoost;
    if (s > 0) results.push({ type: 'ceremony', data: c, score: s });
  }
  for (const l of lineages) {
    const s = scoreRecord(l, [['title', 4], ['era', 2], ['description', 1]], kws) * lineageBoost;
    if (s > 0) results.push({ type: 'lineage', data: l, score: s });
  }
  for (const cl of clans) {
    const s = scoreRecord(cl, [['name', 4], ['lineage_title', 2], ['royal_connection', 2], ['description', 1]], kws) * clanBoost;
    if (s > 0) results.push({ type: 'clan', data: cl, score: s });
  }
  for (const sg of songs) {
    const s = scoreRecord(sg, [['title', 3], ['ceremony_name', 2], ['description', 1]], kws) * songBoost;
    if (s > 0) results.push({ type: 'song', data: sg, score: s });
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, 4);

  if (top.length === 0) {
    return {
      answer: `I searched the platform's cultural records for "${question.trim()}" but found no matching content yet.\n\nOur ceremony keepers and history keepers are continuously adding records. Try rephrasing your question, or check back as more content is published.`,
      source: 'local',
    };
  }

  const sections = top.map(({ type, data }) => fmt[type]?.(data)).filter(Boolean);
  const intro = top.length === 1
    ? 'Here is what I found in the platform records:\n\n'
    : `Here is what I found across ${top.length} records:\n\n`;

  return {
    answer: intro + sections.join('\n\n'),
    source: 'local',
  };
};
