import { query } from '../config/db.js';

export const CeremonyModel = {
  create: ({ name, description, month_celebrated, immunology_notes, created_by }) =>
    query('INSERT INTO ceremonies (name, description, month_celebrated, immunology_notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, description, month_celebrated, immunology_notes, created_by]),

  update: (id, fields) => {
    const allowed = ['name', 'description', 'month_celebrated', 'immunology_notes'];
    const pairs = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!pairs.length) return Promise.resolve();
    return query(
      `UPDATE ceremonies SET ${pairs.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...pairs.map(([, v]) => v), id]
    );
  },

  updateStatus: (id, status, reviewed_by, rejection_note) =>
    query('UPDATE ceremonies SET status = ?, reviewed_by = ?, rejection_note = ? WHERE id = ?', [status, reviewed_by, rejection_note, id]),

  findById: (id) =>
    query('SELECT c.*, u.name AS creator_name FROM ceremonies c JOIN users u ON c.created_by = u.id WHERE c.id = ?', [id]).then(r => r[0]),

  findByCreator: (userId, status) => {
    const where = status ? 'WHERE created_by = ? AND status = ?' : 'WHERE created_by = ?';
    return query(`SELECT * FROM ceremonies ${where} ORDER BY created_at DESC`, status ? [userId, status] : [userId]);
  },

  getAll: ({ status, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const where = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];
    return Promise.all([
      query(`SELECT c.*, u.name AS creator_name FROM ceremonies c JOIN users u ON c.created_by = u.id ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) AS total FROM ceremonies c ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },

  getFullDetail: async (id) => {
    const [ceremony, songs, imvunulo] = await Promise.all([
      query('SELECT c.*, u.name AS creator_name FROM ceremonies c JOIN users u ON c.created_by = u.id WHERE c.id = ?', [id]).then(r => r[0]),
      query('SELECT * FROM ceremony_songs WHERE ceremony_id = ?', [id]),
      query('SELECT i.*, ip.name AS preset_name, ip.gender, ip.image_url AS preset_image_url FROM imvunulo i JOIN imvunulo_presets ip ON i.preset_id = ip.id WHERE i.ceremony_id = ?', [id]),
    ]);
    if (!ceremony) return null;
    return { ...ceremony, songs, imvunulo };
  },
};
