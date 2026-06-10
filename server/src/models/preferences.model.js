import { query } from '../config/db.js';

export const PreferencesModel = {
  findByUser: (user_id) =>
    query(`SELECT * FROM user_preferences WHERE user_id = ?`, [user_id])
      .then(r => r[0]),

  upsert: (user_id, { interests, visitor_type, preferred_lang }) =>
    query(
      `INSERT INTO user_preferences (user_id, interests, visitor_type, preferred_lang)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         interests      = VALUES(interests),
         visitor_type   = VALUES(visitor_type),
         preferred_lang = VALUES(preferred_lang)`,
      [user_id, JSON.stringify(interests || []), visitor_type || 'local', preferred_lang || 'en'],
    ),
};
