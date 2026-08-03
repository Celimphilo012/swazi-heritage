import { query } from '../config/db.js';

export const PreferencesModel = {
  findByUser: (user_id) =>
    query(`SELECT * FROM user_preferences WHERE user_id = ?`, [user_id])
      .then(r => r[0]),

  upsert: (user_id, { interests, visitor_type, preferred_lang, imvunulo_budget_max }) =>
    query(
      `INSERT INTO user_preferences (user_id, interests, visitor_type, preferred_lang, imvunulo_budget_max)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         interests           = VALUES(interests),
         visitor_type        = VALUES(visitor_type),
         preferred_lang      = VALUES(preferred_lang),
         imvunulo_budget_max = VALUES(imvunulo_budget_max)`,
      [user_id, JSON.stringify(interests || []), visitor_type || 'local', preferred_lang || 'en', imvunulo_budget_max ?? null],
    ),
};
