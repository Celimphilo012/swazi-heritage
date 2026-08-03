import { query } from '../config/db.js';

export const ImvunuloListingModel = {
  create: ({ practitioner_id, title, description, listing_type, gender, price, price_unit, image_url, location_name, latitude, longitude, contact }) =>
    query(
      `INSERT INTO imvunulo_listings
       (practitioner_id, title, description, listing_type, gender, price, price_unit, image_url, location_name, latitude, longitude, contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [practitioner_id, title, description ?? null, listing_type || 'sale', gender || 'unisex',
       price ?? null, price_unit ?? null, image_url ?? null, location_name ?? null, latitude ?? null, longitude ?? null, contact ?? null],
    ),

  update: (id, { title, description, listing_type, gender, price, price_unit, image_url, location_name, latitude, longitude, contact, status }) =>
    query(
      `UPDATE imvunulo_listings SET
         title=?, description=?, listing_type=?, gender=?, price=?, price_unit=?,
         image_url=?, location_name=?, latitude=?, longitude=?, contact=?, status=?
       WHERE id=?`,
      [title, description ?? null, listing_type || 'sale', gender || 'unisex',
       price ?? null, price_unit ?? null, image_url ?? null, location_name ?? null, latitude ?? null, longitude ?? null,
       contact ?? null, status || 'active', id],
    ),

  delete: (id) => query(`DELETE FROM imvunulo_listings WHERE id = ?`, [id]),

  findById: (id) =>
    query(
      `SELECT l.*, u.name AS practitioner_name FROM imvunulo_listings l
       JOIN users u ON l.practitioner_id = u.id WHERE l.id = ?`,
      [id],
    ).then(r => r[0]),

  findByPractitioner: (practitioner_id) =>
    query(
      `SELECT * FROM imvunulo_listings WHERE practitioner_id = ? ORDER BY created_at DESC`,
      [practitioner_id],
    ),

  getAll: ({ listing_type, gender, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conditions = [`l.status = 'active'`];
    const params = [];
    if (listing_type) { conditions.push(`l.listing_type IN (?, 'both')`); params.push(listing_type); }
    if (gender) { conditions.push(`l.gender IN (?, 'unisex')`); params.push(gender); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    return Promise.all([
      query(
        `SELECT l.*, u.name AS practitioner_name FROM imvunulo_listings l
         JOIN users u ON l.practitioner_id = u.id ${where}
         ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM imvunulo_listings l ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },

  createEnquiry: ({ listing_id, user_id, user_name, user_email, message }) =>
    query(
      `INSERT INTO imvunulo_listing_enquiries (listing_id, user_id, user_name, user_email, message)
       VALUES (?, ?, ?, ?, ?)`,
      [listing_id, user_id ?? null, user_name, user_email, message],
    ),

  getEnquiriesForPractitioner: (practitioner_id) =>
    query(
      `SELECT le.*, l.title AS listing_title
       FROM imvunulo_listing_enquiries le
       JOIN imvunulo_listings l ON le.listing_id = l.id
       WHERE l.practitioner_id = ?
       ORDER BY le.created_at DESC`,
      [practitioner_id],
    ),

  getUserEnquiries: (user_id) =>
    query(
      `SELECT le.*, l.title AS listing_title, u.name AS practitioner_name
       FROM imvunulo_listing_enquiries le
       JOIN imvunulo_listings l ON le.listing_id = l.id
       JOIN users u ON l.practitioner_id = u.id
       WHERE le.user_id = ?
       ORDER BY le.created_at DESC`,
      [user_id],
    ),

  getEnquiryById: (id) =>
    query(
      `SELECT le.*, l.title AS listing_title, l.practitioner_id,
              u.name AS practitioner_name
       FROM imvunulo_listing_enquiries le
       JOIN imvunulo_listings l ON le.listing_id = l.id
       JOIN users u ON l.practitioner_id = u.id
       WHERE le.id = ?`,
      [id],
    ).then(r => r[0]),

  getMessages: (enquiry_id) =>
    query(
      `SELECT em.*, u.name AS sender_name
       FROM imvunulo_listing_enquiry_messages em
       JOIN users u ON em.sender_id = u.id
       WHERE em.enquiry_id = ?
       ORDER BY em.created_at ASC`,
      [enquiry_id],
    ),

  addMessage: (enquiry_id, sender_id, body) =>
    query(
      `INSERT INTO imvunulo_listing_enquiry_messages (enquiry_id, sender_id, body) VALUES (?, ?, ?)`,
      [enquiry_id, sender_id, body],
    ),
};
