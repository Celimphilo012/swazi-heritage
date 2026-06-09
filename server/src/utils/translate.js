import { ConfigModel } from '../models/models.js';

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

const callGoogleTranslate = async (texts) => {
  let key = null;
  try { key = await ConfigModel.get('google_translate_key'); } catch {}
  key = key || process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return texts.map(() => null);

  const nonEmpty = texts.filter(Boolean);
  if (!nonEmpty.length) return texts.map(() => null);

  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: nonEmpty, source: 'en', target: 'ss', format: 'text' }),
    });
    if (!res.ok) return texts.map(() => null);
    const data = await res.json();
    const results = data?.data?.translations ?? [];
    let i = 0;
    return texts.map(t => (t ? results[i++]?.translatedText ?? null : null));
  } catch {
    return texts.map(() => null);
  }
};

// Auto-fills swati_name / swati_description if not already supplied by the user
export const autoTranslateCeremony = async (body) => {
  const needName = !body.swati_name && body.name;
  const needDesc = !body.swati_description && body.description;
  if (!needName && !needDesc) return body;

  const [ssName, ssDesc] = await callGoogleTranslate([
    needName ? body.name : null,
    needDesc ? body.description : null,
  ]);

  return {
    ...body,
    swati_name: body.swati_name || ssName || null,
    swati_description: body.swati_description || ssDesc || null,
  };
};

// Auto-fills swati_title / swati_description for lineage records
export const autoTranslateLineage = async (body) => {
  const needTitle = !body.swati_title && body.title;
  const needDesc = !body.swati_description && body.description;
  if (!needTitle && !needDesc) return body;

  const [ssTitle, ssDesc] = await callGoogleTranslate([
    needTitle ? body.title : null,
    needDesc ? body.description : null,
  ]);

  return {
    ...body,
    swati_title: body.swati_title || ssTitle || null,
    swati_description: body.swati_description || ssDesc || null,
  };
};
