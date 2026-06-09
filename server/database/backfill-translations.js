/**
 * One-time script: auto-translates existing ceremonies and lineage records
 * that have no siSwati content yet.
 * Run: node database/backfill-translations.js
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

const translateBatch = async (texts) => {
  const nonEmpty = texts.map(t => t || '');
  const res = await fetch(`${TRANSLATE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: nonEmpty, source: 'en', target: 'ss', format: 'text' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Translate API error: ${err}`);
  }
  const data = await res.json();
  return data.data.translations.map(t => t.translatedText);
};

const backfill = async (table, idCol, nameCol, descCol, ssNameCol, ssDescCol) => {
  const [rows] = await pool.execute(
    `SELECT ${idCol}, ${nameCol}, ${descCol} FROM ${table} WHERE ${ssNameCol} IS NULL AND ${nameCol} IS NOT NULL`
  );

  if (!rows.length) {
    console.log(`  ${table}: nothing to translate.`);
    return;
  }

  console.log(`  ${table}: translating ${rows.length} record(s)...`);

  // Batch in groups of 50 to stay well within API limits
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const names = chunk.map(r => r[nameCol] || '');
    const descs = chunk.map(r => r[descCol] || '');

    const allTexts = [...names, ...descs];
    const translated = await translateBatch(allTexts);
    const ssNames = translated.slice(0, chunk.length);
    const ssDescs = translated.slice(chunk.length);

    for (let j = 0; j < chunk.length; j++) {
      await pool.execute(
        `UPDATE ${table} SET ${ssNameCol} = ?, ${ssDescCol} = ? WHERE ${idCol} = ?`,
        [ssNames[j] || null, ssDescs[j] || null, chunk[j][idCol]]
      );
    }

    console.log(`    Translated records ${i + 1}–${i + chunk.length}`);
  }
};

(async () => {
  try {
    console.log('Starting siSwati backfill...\n');
    await backfill('ceremonies',      'id', 'name',  'description', 'swati_name',  'swati_description');
    await backfill('lineage_records', 'id', 'title', 'description', 'swati_title', 'swati_description');
    console.log('\nDone.');
  } catch (err) {
    console.error('Backfill failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
