import { ConfigModel } from '../models/models.js';

const BASE = () => process.env.OLLAMA_URL || 'http://localhost:11434';

const getModel = async () => {
  try {
    const saved = await ConfigModel.get('ollama_model');
    if (saved) return saved;
  } catch {}
  return process.env.OLLAMA_MODEL || 'phi4-mini';
};

export const isOllamaAvailable = async () => {
  try {
    const res = await fetch(`${BASE()}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const listOllamaModels = async () => {
  const res = await fetch(`${BASE()}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('Ollama not reachable');
  const { models = [] } = await res.json();
  return models.map((m) => ({
    name: m.name,
    size: m.size,
    modifiedAt: m.modified_at,
  }));
};

export const generateWithOllama = async (systemPrompt, userQuestion) => {
  const model = await getModel();
  const res = await fetch(`${BASE()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userQuestion },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Ollama HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.message?.content?.trim();
};

// Build a focused RAG prompt from retrieved documents
export const buildRagPrompt = (docs) => {
  const fmt = {
    ceremony: (d) =>
      `[Ceremony] ${d.name}${d.month_celebrated ? ` — ${d.month_celebrated}` : ''}\n${d.description || ''}${d.immunology_notes ? `\nHealth notes: ${d.immunology_notes}` : ''}`,
    lineage: (d) =>
      `[Lineage Record] ${d.title}${d.era ? ` (${d.era})` : ''}\n${d.description || ''}`,
    clan: (d) =>
      `[Clan] ${d.name}${d.lineage_title ? ` — lineage: ${d.lineage_title}` : ''}${d.royal_connection ? `\nRoyal connection: ${d.royal_connection}` : ''}${d.description ? `\n${d.description}` : ''}`,
    song: (d) =>
      `[Song] "${d.title}"${d.ceremony_name ? ` — sung at ${d.ceremony_name}` : ''}${d.description ? `\n${d.description}` : ''}`,
  };

  const context = docs
    .map(({ type, data }) => fmt[type]?.(data))
    .filter(Boolean)
    .join('\n\n---\n\n');

  return `You are a knowledgeable and respectful cultural assistant for the Kingdom of Eswatini (Swaziland).
Your role is to help users understand Swazi traditions, royal ceremonies, clan lineages, and cultural practices.

Answer the user's question using ONLY the cultural records provided below.
Be concise, accurate, and warm. Do not fabricate names, dates, or events not present in the records.
If the records don't fully answer the question, say so briefly and suggest what they do cover.

--- RELEVANT CULTURAL RECORDS ---
${context || 'No specific records were retrieved for this query.'}
--- END OF RECORDS ---`;
};
