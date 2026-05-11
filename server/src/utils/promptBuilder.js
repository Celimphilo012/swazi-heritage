import { query } from '../config/db.js';

const getCulturalContext = async () => {
  const [ceremonies, songs, imvunulo, lineage, clans] = await Promise.all([
    query("SELECT name, description, month_celebrated, immunology_notes FROM ceremonies WHERE status = 'published'"),
    query("SELECT cs.title, cs.description, c.name AS ceremony_name FROM ceremony_songs cs JOIN ceremonies c ON cs.ceremony_id = c.id"),
    query("SELECT i.notes, i.color_desc, ip.name, ip.gender, c.name AS ceremony_name FROM imvunulo i JOIN imvunulo_presets ip ON i.preset_id = ip.id JOIN ceremonies c ON i.ceremony_id = c.id"),
    query("SELECT title, description, era FROM lineage_records WHERE status = 'published'"),
    query("SELECT cl.name, cl.royal_connection, cl.founding_era, lr.title AS lineage_title FROM clans cl JOIN lineage_records lr ON cl.lineage_id = lr.id"),
  ]);
  return { ceremonies, songs, imvunulo, lineage, clans };
};

const getSystemPrompt = async () => {
  const rows = await query("SELECT value FROM system_config WHERE `key` = 'ai_system_prompt'");
  return rows[0]?.value ||
    `You are a knowledgeable cultural assistant for the Kingdom of Eswatini (Swaziland).
Answer questions about Swazi traditions, royal ceremonies, clan lineages, and cultural practices.
Use the provided platform data as your primary source.
If the data does not cover the question, draw on general Swazi cultural knowledge and state: "Based on general knowledge:"
Always be respectful of Swazi culture and the royal family.
Do not fabricate ceremony names, clan names, or royal figures.`;
};

export const detectSource = (answer) =>
  answer.toLowerCase().includes('based on general knowledge') ? 'hybrid' : 'db_only';

export const buildPrompt = async (question) => {
  const [systemPrompt, ctx] = await Promise.all([getSystemPrompt(), getCulturalContext()]);
  return `${systemPrompt}

--- PLATFORM CULTURAL DATA ---
CEREMONIES:
${JSON.stringify(ctx.ceremonies, null, 2)}

SONGS:
${JSON.stringify(ctx.songs, null, 2)}

IMVUNULO (Traditional Attire):
${JSON.stringify(ctx.imvunulo, null, 2)}

ROYAL LINEAGE:
${JSON.stringify(ctx.lineage, null, 2)}

CLANS:
${JSON.stringify(ctx.clans, null, 2)}
--- END ---

User question: ${question}
`;
};
