import { query } from '../config/db.js';

export const LineageModel = {
  create: ({ title, description, era, created_by }) =>
    query('INSERT INTO lineage_records (title, description, era, created_by) VALUES (?, ?, ?, ?)', [title, description, era, created_by]),
  update: (id, { title, description, era }) =>
    query('UPDATE lineage_records SET title = ?, description = ?, era = ? WHERE id = ?', [title, description, era, id]),
  updateStatus: (id, status, reviewed_by) =>
    query('UPDATE lineage_records SET status = ?, reviewed_by = ? WHERE id = ?', [status, reviewed_by, id]),
  findById: (id) =>
    query('SELECT lr.*, u.name AS creator_name FROM lineage_records lr JOIN users u ON lr.created_by = u.id WHERE lr.id = ?', [id]).then(r => r[0]),
  getAll: ({ status, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const where = status ? 'WHERE lr.status = ?' : '';
    const params = status ? [status] : [];
    return Promise.all([
      query(`SELECT lr.*, u.name AS creator_name FROM lineage_records lr JOIN users u ON lr.created_by = u.id ${where} ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) AS total FROM lineage_records lr ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },
  getWithClans: async (id) => {
    const [record, clans] = await Promise.all([
      query('SELECT lr.*, u.name AS creator_name FROM lineage_records lr JOIN users u ON lr.created_by = u.id WHERE lr.id = ?', [id]).then(r => r[0]),
      query('SELECT * FROM clans WHERE lineage_id = ?', [id]),
    ]);
    if (!record) return null;
    return { ...record, clans };
  },
};

export const ClanModel = {
  create: ({ lineage_id, name, royal_connection, founding_era, description }) =>
    query('INSERT INTO clans (lineage_id, name, royal_connection, founding_era, description) VALUES (?, ?, ?, ?, ?)',
      [lineage_id, name, royal_connection, founding_era, description]),
  update: (id, { name, royal_connection, founding_era, description }) =>
    query('UPDATE clans SET name = ?, royal_connection = ?, founding_era = ?, description = ? WHERE id = ?',
      [name, royal_connection, founding_era, description, id]),
  findByLineage: (lineage_id) => query('SELECT * FROM clans WHERE lineage_id = ?', [lineage_id]),
  delete: (id) => query('DELETE FROM clans WHERE id = ?', [id]),
};

export const SongModel = {
  create: ({ ceremony_id, title, description, audio_url }) =>
    query('INSERT INTO ceremony_songs (ceremony_id, title, description, audio_url) VALUES (?, ?, ?, ?)',
      [ceremony_id, title, description, audio_url]),
  update: (id, { title, description, audio_url }) =>
    query('UPDATE ceremony_songs SET title = ?, description = ?, audio_url = ? WHERE id = ?',
      [title, description, audio_url, id]),
  findByCeremony: (ceremony_id) => query('SELECT * FROM ceremony_songs WHERE ceremony_id = ?', [ceremony_id]),
  delete: (id) => query('DELETE FROM ceremony_songs WHERE id = ?', [id]),
};

export const ImvunuloModel = {
  getPresets: () => query('SELECT * FROM imvunulo_presets WHERE active = 1 ORDER BY name'),
  createPreset: ({ name, description, gender }) =>
    query('INSERT INTO imvunulo_presets (name, description, gender) VALUES (?, ?, ?)', [name, description, gender]),
  updatePreset: (id, { name, description, gender, active }) =>
    query('UPDATE imvunulo_presets SET name = ?, description = ?, gender = ?, active = ? WHERE id = ?',
      [name, description, gender, active, id]),
  addToCeremony: ({ ceremony_id, preset_id, notes, image_url, color_desc }) =>
    query('INSERT INTO imvunulo (ceremony_id, preset_id, notes, image_url, color_desc) VALUES (?, ?, ?, ?, ?)',
      [ceremony_id, preset_id, notes, image_url, color_desc]),
  findByCeremony: (ceremony_id) =>
    query('SELECT i.*, ip.name, ip.gender FROM imvunulo i JOIN imvunulo_presets ip ON i.preset_id = ip.id WHERE i.ceremony_id = ?',
      [ceremony_id]),
  delete: (id) => query('DELETE FROM imvunulo WHERE id = ?', [id]),
};

export const CinemaModel = {
  create: ({ title, description, type, stream_url, scheduled_at, created_by }) =>
    query('INSERT INTO cinemas (title, description, type, stream_url, scheduled_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, type, stream_url, scheduled_at, created_by]),
  update: (id, fields) => {
    const allowed = ['title', 'description', 'type', 'stream_url', 'scheduled_at', 'status'];
    const pairs = Object.entries(fields).filter(([k]) => allowed.includes(k));
    if (!pairs.length) return Promise.resolve();
    return query(
      `UPDATE cinemas SET ${pairs.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...pairs.map(([, v]) => v), id]
    );
  },
  findById: (id) =>
    query('SELECT c.*, u.name AS creator_name, (SELECT COUNT(*) FROM bookings WHERE cinema_id = c.id AND status = "confirmed") AS booking_count FROM cinemas c JOIN users u ON c.created_by = u.id WHERE c.id = ?', [id]).then(r => r[0]),
  getAll: ({ type, status, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conds = [], params = [];
    if (type)   { conds.push('c.type = ?');   params.push(type); }
    if (status) { conds.push('c.status = ?'); params.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return Promise.all([
      query(`SELECT c.*, u.name AS creator_name FROM cinemas c JOIN users u ON c.created_by = u.id ${where} ORDER BY c.scheduled_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) AS total FROM cinemas c ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },
};

export const BookingModel = {
  create: ({ user_id, cinema_id }) => query('INSERT INTO bookings (user_id, cinema_id) VALUES (?, ?)', [user_id, cinema_id]),
  findByUser: (user_id) => query('SELECT b.*, c.title, c.type, c.scheduled_at, c.stream_url, c.status AS cinema_status FROM bookings b JOIN cinemas c ON b.cinema_id = c.id WHERE b.user_id = ? ORDER BY b.booked_at DESC', [user_id]),
  findByCinema: (cinema_id) => query('SELECT b.*, u.name, u.email FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.cinema_id = ?', [cinema_id]),
  exists: (user_id, cinema_id) => query('SELECT id FROM bookings WHERE user_id = ? AND cinema_id = ?', [user_id, cinema_id]).then(r => r.length > 0),
  updateStatus: (id, status) => query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]),
};

export const PromptModel = {
  save: ({ user_id, question, answer, source }) =>
    query('INSERT INTO ai_prompts (user_id, question, answer, source) VALUES (?, ?, ?, ?)', [user_id, question, answer, source]),
  findByUser: (user_id, limit = 50) =>
    query('SELECT id, question, answer, source, created_at FROM ai_prompts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [user_id, limit]),
  getAll: ({ page = 1, limit = 30 }) => {
    const offset = (page - 1) * limit;
    return query('SELECT ap.*, u.name AS user_name FROM ai_prompts ap JOIN users u ON ap.user_id = u.id ORDER BY ap.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  },
};

export const AuditLogModel = {
  getAll: ({ page = 1, limit = 50 }) => {
    const offset = (page - 1) * limit;
    return query('SELECT al.*, u.name AS admin_name FROM audit_log al JOIN users u ON al.admin_id = u.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  },
};

export const ConfigModel = {
  get: (config_key) => query('SELECT value FROM system_config WHERE config_key = ?', [config_key]).then(r => r[0]?.value),
  getAll: () => query('SELECT config_key, value, description FROM system_config ORDER BY config_key'),
  upsert: (config_key, value) =>
    query('INSERT INTO system_config (config_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [config_key, value]),
};
