import { query } from '../config/db.js';

export const TourismModel = {
  create: ({ name, description, category, interest_tags, price_range, image_url, location_name, latitude, longitude, contact, website, created_by }) =>
    query(
      `INSERT INTO tourist_sites
       (name, description, category, interest_tags, price_range, image_url, location_name, latitude, longitude, contact, website, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description ?? null, category || 'heritage_site', JSON.stringify(interest_tags || []),
       price_range ?? null, image_url ?? null, location_name ?? null, latitude ?? null, longitude ?? null,
       contact ?? null, website ?? null, created_by ?? null],
    ),

  update: (id, { name, description, category, interest_tags, price_range, image_url, location_name, latitude, longitude, contact, website, status }) =>
    query(
      `UPDATE tourist_sites SET
         name=?, description=?, category=?, interest_tags=?, price_range=?, image_url=?,
         location_name=?, latitude=?, longitude=?, contact=?, website=?, status=?
       WHERE id=?`,
      [name, description ?? null, category || 'heritage_site', JSON.stringify(interest_tags || []),
       price_range ?? null, image_url ?? null, location_name ?? null, latitude ?? null, longitude ?? null,
       contact ?? null, website ?? null, status || 'active', id],
    ),

  delete: (id) => query(`DELETE FROM tourist_sites WHERE id = ?`, [id]),

  findById: (id) => query(`SELECT * FROM tourist_sites WHERE id = ?`, [id]).then(r => r[0]),

  getAll: ({ category, page = 1, limit = 30 }) => {
    const offset = (page - 1) * limit;
    const conditions = [`status = 'active'`];
    const params = [];
    if (category) { conditions.push(`category = ?`); params.push(category); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    return Promise.all([
      query(`SELECT * FROM tourist_sites ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) AS total FROM tourist_sites ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },

  getAllAdmin: () => query(`SELECT * FROM tourist_sites ORDER BY created_at DESC`),

  getRecommended: (tagInterests, limit = 6) => {
    if (!tagInterests.length) return Promise.resolve([]);
    const conditions = tagInterests.map(() => `JSON_CONTAINS(interest_tags, JSON_QUOTE(?))`);
    return query(
      `SELECT * FROM tourist_sites WHERE status = 'active' AND (${conditions.join(' OR ')})
       ORDER BY created_at DESC LIMIT ?`,
      [...tagInterests, limit],
    );
  },
};
