import { query } from '../config/db.js';

export const StepsModel = {
  findByCeremony: (ceremony_id) =>
    query(
      `SELECT * FROM ceremony_steps WHERE ceremony_id = ? ORDER BY step_number ASC`,
      [ceremony_id],
    ),

  findById: (id) =>
    query(`SELECT * FROM ceremony_steps WHERE id = ?`, [id]).then(r => r[0]),

  getNextStepNumber: (ceremony_id) =>
    query(
      `SELECT COALESCE(MAX(step_number), 0) + 1 AS next FROM ceremony_steps WHERE ceremony_id = ?`,
      [ceremony_id],
    ).then(r => r[0].next),

  create: ({ ceremony_id, step_number, title, description, media_url }) =>
    query(
      `INSERT INTO ceremony_steps (ceremony_id, step_number, title, description, media_url)
       VALUES (?, ?, ?, ?, ?)`,
      [ceremony_id, step_number, title, description ?? null, media_url ?? null],
    ),

  update: (id, { title, description, media_url, step_number }) =>
    query(
      `UPDATE ceremony_steps SET title=?, description=?, media_url=?, step_number=? WHERE id=?`,
      [title, description ?? null, media_url ?? null, step_number, id],
    ),

  delete: (id) => query(`DELETE FROM ceremony_steps WHERE id = ?`, [id]),
};
