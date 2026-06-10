import { query } from '../config/db.js';

export const ServicesModel = {
  create: ({ practitioner_id, title, description, category, price_range, contact, image_url }) =>
    query(
      `INSERT INTO services (practitioner_id, title, description, category, price_range, contact, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [practitioner_id, title, description, category, price_range ?? null, contact ?? null, image_url ?? null],
    ),

  update: (id, { title, description, category, price_range, contact, image_url, status }) =>
    query(
      `UPDATE services SET title=?, description=?, category=?, price_range=?, contact=?, image_url=?, status=? WHERE id=?`,
      [title, description, category, price_range ?? null, contact ?? null, image_url ?? null, status || 'active', id],
    ),

  delete: (id) => query(`DELETE FROM services WHERE id = ?`, [id]),

  findById: (id) =>
    query(
      `SELECT s.*, u.name AS practitioner_name FROM services s
       JOIN users u ON s.practitioner_id = u.id WHERE s.id = ?`,
      [id],
    ).then(r => r[0]),

  findByPractitioner: (practitioner_id) =>
    query(
      `SELECT * FROM services WHERE practitioner_id = ? ORDER BY created_at DESC`,
      [practitioner_id],
    ),

  getAll: ({ category, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const where = category
      ? `WHERE s.status = 'active' AND s.category = ?`
      : `WHERE s.status = 'active'`;
    const params = category ? [category] : [];
    return Promise.all([
      query(
        `SELECT s.*, u.name AS practitioner_name FROM services s
         JOIN users u ON s.practitioner_id = u.id ${where}
         ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM services s ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },

  createEnquiry: ({ service_id, user_id, user_name, user_email, message }) =>
    query(
      `INSERT INTO service_enquiries (service_id, user_id, user_name, user_email, message)
       VALUES (?, ?, ?, ?, ?)`,
      [service_id, user_id ?? null, user_name, user_email, message],
    ),

  getEnquiriesForPractitioner: (practitioner_id) =>
    query(
      `SELECT se.*, s.title AS service_title
       FROM service_enquiries se
       JOIN services s ON se.service_id = s.id
       WHERE s.practitioner_id = ?
       ORDER BY se.created_at DESC`,
      [practitioner_id],
    ),

  getUserEnquiries: (user_id) =>
    query(
      `SELECT se.*, s.title AS service_title, u.name AS practitioner_name
       FROM service_enquiries se
       JOIN services s ON se.service_id = s.id
       JOIN users u ON s.practitioner_id = u.id
       WHERE se.user_id = ?
       ORDER BY se.created_at DESC`,
      [user_id],
    ),

  getEnquiryById: (id) =>
    query(
      `SELECT se.*, s.title AS service_title, s.practitioner_id,
              u.name AS practitioner_name
       FROM service_enquiries se
       JOIN services s ON se.service_id = s.id
       JOIN users u ON s.practitioner_id = u.id
       WHERE se.id = ?`,
      [id],
    ).then(r => r[0]),

  getMessages: (enquiry_id) =>
    query(
      `SELECT em.*, u.name AS sender_name
       FROM enquiry_messages em
       JOIN users u ON em.sender_id = u.id
       WHERE em.enquiry_id = ?
       ORDER BY em.created_at ASC`,
      [enquiry_id],
    ),

  addMessage: (enquiry_id, sender_id, body) =>
    query(
      `INSERT INTO enquiry_messages (enquiry_id, sender_id, body) VALUES (?, ?, ?)`,
      [enquiry_id, sender_id, body],
    ),
};
