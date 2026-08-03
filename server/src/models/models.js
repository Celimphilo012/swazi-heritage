import { query } from "../config/db.js";

// ─── Lineage Records ──────────────────────────────────────────────────────────
export const LineageModel = {
  create: ({ title, description, era, swati_title, swati_description, location_name, latitude, longitude, category, created_by }) =>
    query(
      `INSERT INTO lineage_records (title, description, era, swati_title, swati_description, location_name, latitude, longitude, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, era, swati_title ?? null, swati_description ?? null, location_name ?? null, latitude ?? null, longitude ?? null, category ?? null, created_by],
    ),

  update: (id, { title, description, era, swati_title, swati_description, location_name, latitude, longitude, category }) =>
    query(
      `UPDATE lineage_records SET title = ?, description = ?, era = ?, swati_title = ?, swati_description = ?, location_name = ?, latitude = ?, longitude = ?, category = ? WHERE id = ?`,
      [title, description, era, swati_title ?? null, swati_description ?? null, location_name ?? null, latitude ?? null, longitude ?? null, category ?? null, id],
    ),

  updateStatus: (id, status, reviewed_by, rejection_note) =>
    query(
      `UPDATE lineage_records SET status = ?, reviewed_by = ?, rejection_note = ? WHERE id = ?`,
      [status, reviewed_by, rejection_note, id],
    ),

  findByCreator: (userId, status) => {
    const where = status
      ? 'WHERE lr.created_by = ? AND lr.status = ?'
      : 'WHERE lr.created_by = ?';
    const params = status ? [userId, status] : [userId];
    return query(
      `SELECT lr.*, u.name AS creator_name FROM lineage_records lr
       JOIN users u ON lr.created_by = u.id ${where}
       ORDER BY lr.created_at DESC`,
      params,
    );
  },

  findById: (id) =>
    query(
      `SELECT lr.*, u.name AS creator_name FROM lineage_records lr
           JOIN users u ON lr.created_by = u.id WHERE lr.id = ?`,
      [id],
    ).then((r) => r[0]),

  getAll: ({ status, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const where = status ? "WHERE lr.status = ?" : "";
    const params = status ? [status] : [];
    return Promise.all([
      query(
        `SELECT lr.*, u.name AS creator_name FROM lineage_records lr
             JOIN users u ON lr.created_by = u.id ${where}
             ORDER BY lr.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM lineage_records lr ${where}`, params),
    ]).then(([rows, count]) => ({ rows, total: count[0].total }));
  },

  getWithClans: async (id) => {
    const [record, clans] = await Promise.all([
      query(
        `SELECT lr.*, u.name AS creator_name FROM lineage_records lr
             JOIN users u ON lr.created_by = u.id WHERE lr.id = ?`,
        [id],
      ).then((r) => r[0]),
      query(`SELECT * FROM clans WHERE lineage_id = ?`, [id]),
    ]);
    if (!record) return null;
    return { ...record, clans };
  },
};

// ─── Clans ────────────────────────────────────────────────────────────────────
export const ClanModel = {
  create: ({ lineage_id, name, royal_connection, founding_era, description, location_name, latitude, longitude }) =>
    query(
      `INSERT INTO clans (lineage_id, name, royal_connection, founding_era, description, location_name, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lineage_id, name, royal_connection, founding_era, description, location_name ?? null, latitude ?? null, longitude ?? null],
    ),

  update: (id, { name, royal_connection, founding_era, description, location_name, latitude, longitude }) =>
    query(
      `UPDATE clans SET name = ?, royal_connection = ?, founding_era = ?, description = ?, location_name = ?, latitude = ?, longitude = ?
           WHERE id = ?`,
      [name, royal_connection, founding_era, description, location_name ?? null, latitude ?? null, longitude ?? null, id],
    ),

  findByLineage: (lineage_id) =>
    query(`SELECT * FROM clans WHERE lineage_id = ?`, [lineage_id]),

  delete: (id) => query(`DELETE FROM clans WHERE id = ?`, [id]),
};

// ─── Ceremony Songs ───────────────────────────────────────────────────────────
export const SongModel = {
  create: ({ ceremony_id, title, description, audio_url }) =>
    query(
      `INSERT INTO ceremony_songs (ceremony_id, title, description, audio_url)
           VALUES (?, ?, ?, ?)`,
      [ceremony_id, title, description, audio_url],
    ),

  update: (id, { title, description, audio_url }) =>
    query(
      `UPDATE ceremony_songs SET title = ?, description = ?, audio_url = ? WHERE id = ?`,
      [title, description, audio_url, id],
    ),

  findByCeremony: (ceremony_id) =>
    query(`SELECT * FROM ceremony_songs WHERE ceremony_id = ?`, [ceremony_id]),

  delete: (id) => query(`DELETE FROM ceremony_songs WHERE id = ?`, [id]),
};

// ─── Imvunulo ─────────────────────────────────────────────────────────────────
export const ImvunuloModel = {
  // Admin-managed preset options
  getPresets: () =>
    query(`SELECT * FROM imvunulo_presets WHERE active = 1 ORDER BY name`),
  createPreset: ({ name, description, gender, image_url }) =>
    query(
      `INSERT INTO imvunulo_presets (name, description, gender, image_url) VALUES (?, ?, ?, ?)`,
      [name, description, gender, image_url || null],
    ),
  updatePreset: (id, { name, description, gender, active, image_url }) =>
    query(
      `UPDATE imvunulo_presets SET name = ?, description = ?, gender = ?, active = ?, image_url = ? WHERE id = ?`,
      [name, description, gender, active, image_url || null, id],
    ),

  // Ceremony-linked imvunulo entries
  addToCeremony: ({ ceremony_id, preset_id, notes, image_url, color_desc }) =>
    query(
      `INSERT INTO imvunulo (ceremony_id, preset_id, notes, image_url, color_desc)
           VALUES (?, ?, ?, ?, ?)`,
      [ceremony_id, preset_id, notes, image_url, color_desc],
    ),

  findByCeremony: (ceremony_id) =>
    query(
      `SELECT i.*, ip.name AS preset_name, ip.gender, ip.image_url AS preset_image_url FROM imvunulo i
           JOIN imvunulo_presets ip ON i.preset_id = ip.id
           WHERE i.ceremony_id = ?`,
      [ceremony_id],
    ),

  delete: (id) => query(`DELETE FROM imvunulo WHERE id = ?`, [id]),
};

// ─── Cinema Sessions ──────────────────────────────────────────────────────────
export const CinemaModel = {
  create: ({
    title,
    description,
    type,
    stream_url,
    scheduled_at,
    status = 'scheduled',
    created_by,
  }) =>
    query(
      `INSERT INTO cinemas (title, description, type, stream_url, scheduled_at, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, type, stream_url, scheduled_at, status, created_by],
    ),

  update: (id, fields) => {
    const allowed = [
      "title",
      "description",
      "type",
      "stream_url",
      "scheduled_at",
      "status",
    ];
    const updates = Object.entries(fields)
      .filter(([k]) => allowed.includes(k))
      .map(([k]) => `${k} = ?`);
    const values = Object.entries(fields)
      .filter(([k]) => allowed.includes(k))
      .map(([, v]) => v);
    if (!updates.length) return Promise.resolve();
    return query(`UPDATE cinemas SET ${updates.join(", ")} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  findById: (id) =>
    query(
      `SELECT c.*, u.name AS creator_name,
           (SELECT COUNT(*) FROM bookings WHERE cinema_id = c.id AND status = 'confirmed') AS booking_count
           FROM cinemas c JOIN users u ON c.created_by = u.id WHERE c.id = ?`,
      [id],
    ).then((r) => r[0]),

  getAll: ({ type, status, statuses, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (type) {
      conditions.push("c.type = ?");
      params.push(type);
    }
    if (status) {
      conditions.push("c.status = ?");
      params.push(status);
    } else if (statuses && statuses.length) {
      conditions.push(`c.status IN (${statuses.map(() => "?").join(",")})`);
      params.push(...statuses);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return Promise.all([
      query(
        `SELECT c.*, u.name AS creator_name FROM cinemas c
             JOIN users u ON c.created_by = u.id ${where}
             ORDER BY c.scheduled_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM cinemas c ${where}`, params),
    ]).then(([rows, count]) => ({ rows, total: count[0].total }));
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const BookingModel = {
  create: ({ user_id, cinema_id }) =>
    query(`INSERT INTO bookings (user_id, cinema_id) VALUES (?, ?)`, [
      user_id,
      cinema_id,
    ]),

  findByUser: (user_id) =>
    query(
      `SELECT b.id, b.cinema_id, b.user_id, b.booked_at,
              b.status AS booking_status,
              c.title, c.type, c.scheduled_at, c.stream_url,
              c.status AS session_status
           FROM bookings b JOIN cinemas c ON b.cinema_id = c.id
           WHERE b.user_id = ? ORDER BY b.booked_at DESC`,
      [user_id],
    ),

  findByCinema: (cinema_id) =>
    query(
      `SELECT b.*, u.name, u.email FROM bookings b
           JOIN users u ON b.user_id = u.id WHERE b.cinema_id = ?`,
      [cinema_id],
    ),

  exists: (user_id, cinema_id) =>
    query(`SELECT id FROM bookings WHERE user_id = ? AND cinema_id = ?`, [
      user_id,
      cinema_id,
    ]).then((r) => r.length > 0),

  updateStatus: (id, status) =>
    query(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]),
};

// ─── Seminars / Workshops ───────────────────────────────────────────────────────
export const SeminarModel = {
  create: ({
    practitioner_id,
    title,
    description,
    format,
    meeting_url,
    location_name,
    latitude,
    longitude,
    scheduled_at,
    duration_minutes = 60,
    capacity,
  }) =>
    query(
      `INSERT INTO seminars
           (practitioner_id, title, description, format, meeting_url, location_name, latitude, longitude, scheduled_at, duration_minutes, capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        practitioner_id, title, description ?? null, format,
        meeting_url ?? null, location_name ?? null, latitude ?? null, longitude ?? null,
        scheduled_at, duration_minutes, capacity ?? null,
      ],
    ),

  update: (id, fields) => {
    const allowed = [
      "title", "description", "format", "meeting_url",
      "location_name", "latitude", "longitude",
      "scheduled_at", "duration_minutes", "capacity", "status",
    ];
    const updates = Object.entries(fields).filter(([k]) => allowed.includes(k)).map(([k]) => `${k} = ?`);
    const values = Object.entries(fields).filter(([k]) => allowed.includes(k)).map(([, v]) => v);
    if (!updates.length) return Promise.resolve();
    return query(`UPDATE seminars SET ${updates.join(", ")} WHERE id = ?`, [...values, id]);
  },

  findById: (id) =>
    query(
      `SELECT s.*, u.name AS practitioner_name,
           (SELECT COUNT(*) FROM seminar_bookings WHERE seminar_id = s.id AND status = 'confirmed') AS booking_count
           FROM seminars s JOIN users u ON s.practitioner_id = u.id WHERE s.id = ?`,
      [id],
    ).then((r) => r[0]),

  getAll: ({ format, status, statuses, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (format) { conditions.push("s.format = ?"); params.push(format); }
    if (status) { conditions.push("s.status = ?"); params.push(status); }
    else if (statuses && statuses.length) {
      conditions.push(`s.status IN (${statuses.map(() => "?").join(",")})`);
      params.push(...statuses);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return Promise.all([
      query(
        `SELECT s.*, u.name AS practitioner_name,
             (SELECT COUNT(*) FROM seminar_bookings WHERE seminar_id = s.id AND status = 'confirmed') AS booking_count
             FROM seminars s JOIN users u ON s.practitioner_id = u.id ${where}
             ORDER BY s.scheduled_at ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM seminars s ${where}`, params),
    ]).then(([rows, count]) => ({ rows, total: count[0].total }));
  },

  findByPractitioner: (practitioner_id) =>
    query(
      `SELECT s.*,
           (SELECT COUNT(*) FROM seminar_bookings WHERE seminar_id = s.id AND status = 'confirmed') AS booking_count
           FROM seminars s WHERE s.practitioner_id = ? ORDER BY s.scheduled_at DESC`,
      [practitioner_id],
    ),
};

// ─── Seminar Bookings ────────────────────────────────────────────────────────
export const SeminarBookingModel = {
  create: ({ user_id, seminar_id }) =>
    query(`INSERT INTO seminar_bookings (user_id, seminar_id) VALUES (?, ?)`, [user_id, seminar_id]),

  findByUser: (user_id) =>
    query(
      `SELECT sb.id, sb.seminar_id, sb.user_id, sb.booked_at,
              sb.status AS booking_status,
              s.title, s.format, s.scheduled_at, s.duration_minutes,
              s.meeting_url, s.location_name, s.latitude, s.longitude,
              s.status AS session_status
           FROM seminar_bookings sb JOIN seminars s ON sb.seminar_id = s.id
           WHERE sb.user_id = ? ORDER BY sb.booked_at DESC`,
      [user_id],
    ),

  findBySeminar: (seminar_id) =>
    query(
      `SELECT sb.*, u.name, u.email FROM seminar_bookings sb
           JOIN users u ON sb.user_id = u.id WHERE sb.seminar_id = ?`,
      [seminar_id],
    ),

  exists: (user_id, seminar_id) =>
    query(`SELECT id FROM seminar_bookings WHERE user_id = ? AND seminar_id = ?`, [user_id, seminar_id])
      .then((r) => r.length > 0),

  countConfirmed: (seminar_id) =>
    query(`SELECT COUNT(*) AS total FROM seminar_bookings WHERE seminar_id = ? AND status = 'confirmed'`, [seminar_id])
      .then((r) => r[0].total),

  updateStatus: (id, status) =>
    query(`UPDATE seminar_bookings SET status = ? WHERE id = ?`, [status, id]),

  findById: (id) =>
    query(`SELECT * FROM seminar_bookings WHERE id = ?`, [id]).then((r) => r[0]),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const NotificationModel = {
  create: ({ user_id, type, title, body, link }) =>
    query(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)`,
      [user_id, type, title, body ?? null, link ?? null],
    ),

  createMany: (rows) => {
    if (!rows.length) return Promise.resolve();
    const values = rows.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const params = rows.flatMap((r) => [r.user_id, r.type, r.title, r.body ?? null, r.link ?? null]);
    return query(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES ${values}`,
      params,
    );
  },

  findByUser: (user_id, { limit = 30 } = {}) =>
    query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [user_id, limit],
    ),

  countUnread: (user_id) =>
    query(`SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL`, [user_id])
      .then((r) => r[0].total),

  markRead: (id, user_id) =>
    query(`UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?`, [id, user_id]),

  markAllRead: (user_id) =>
    query(`UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`, [user_id]),
};

// ─── AI Prompts ───────────────────────────────────────────────────────────────
export const PromptModel = {
  save: ({ user_id, question, answer, source }) =>
    query(
      `INSERT INTO ai_prompts (user_id, question, answer, source) VALUES (?, ?, ?, ?)`,
      [user_id, question, answer, source],
    ),

  findByUser: (user_id, limit = 20) =>
    query(
      `SELECT id, question, answer, source, created_at FROM ai_prompts
           WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [user_id, limit],
    ),

  getAll: ({ page = 1, limit = 30 }) => {
    const offset = (page - 1) * limit;
    return query(
      `SELECT ap.*, u.name AS user_name FROM ai_prompts ap
                  JOIN users u ON ap.user_id = u.id
                  ORDER BY ap.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  },
};

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const AuditLogModel = {
  getAll: ({ page = 1, limit = 50 }) => {
    const offset = (page - 1) * limit;
    return query(
      `SELECT al.*, u.name AS admin_name FROM audit_log al
                  JOIN users u ON al.admin_id = u.id
                  ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
  },
};

// ─── System Config ────────────────────────────────────────────────────────────
export const ConfigModel = {
  get: (key) =>
    query(`SELECT value FROM system_config WHERE config_key = ?`, [key]).then(
      (r) => r[0]?.value,
    ),

  getAll: () =>
    query(
      `SELECT config_key AS \`key\`, value, description FROM system_config ORDER BY config_key`,
    ),

  upsert: (key, value) =>
    query(
      `INSERT INTO system_config (config_key, value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [key, value],
    ),
};

// ─── Re-export UserModel so routes/index.js can import it from here ───────────
// routes/index.js imports { UserModel } from '../models/models.js'
// UserModel lives in user.model.js — this re-export bridges them.
export { UserModel } from "./user.model.js";

// ─── Re-exports for new feature models ───────────────────────────────────────
export { PreferencesModel } from "./preferences.model.js";
export { ServicesModel }    from "./services.model.js";
export { ImvunuloListingModel } from "./imvunulo-listings.model.js";
export { TourismModel } from "./tourism.model.js";
export { PublicationsModel } from "./publications.model.js";
export { RatingsModel }     from "./ratings.model.js";
export { StepsModel }       from "./steps.model.js";
