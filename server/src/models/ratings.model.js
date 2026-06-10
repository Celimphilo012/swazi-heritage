import { query } from '../config/db.js';

export const RatingsModel = {
  upsert: ({ user_id, content_type, content_id, score, comment }) =>
    query(
      `INSERT INTO ratings (user_id, content_type, content_id, score, comment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), comment = VALUES(comment), updated_at = CURRENT_TIMESTAMP`,
      [user_id, content_type, content_id, score, comment ?? null],
    ),

  findByContent: (content_type, content_id) =>
    query(
      `SELECT r.id, r.score, r.comment, r.created_at, u.name AS user_name
       FROM ratings r JOIN users u ON r.user_id = u.id
       WHERE r.content_type = ? AND r.content_id = ?
       ORDER BY r.created_at DESC`,
      [content_type, content_id],
    ),

  findByUser: (user_id, content_type, content_id) =>
    query(
      `SELECT * FROM ratings WHERE user_id = ? AND content_type = ? AND content_id = ?`,
      [user_id, content_type, content_id],
    ).then(r => r[0]),

  getSummary: (content_type, content_id) =>
    query(
      `SELECT COUNT(*) AS count, AVG(score) AS average FROM ratings WHERE content_type = ? AND content_id = ?`,
      [content_type, content_id],
    ).then(r => ({
      count: Number(r[0].count),
      average: r[0].average ? parseFloat(r[0].average).toFixed(1) : null,
    })),

  getAll: ({ page = 1, limit = 50 }) => {
    const offset = (page - 1) * limit;
    return Promise.all([
      query(
        `SELECT r.*, u.name AS user_name FROM ratings r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM ratings`),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },
};
