import { query } from '../config/db.js';

export const UserModel = {
  findByEmail: (email) => query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]).then(r => r[0]),
  findById: (id) => query('SELECT id, name, email, role, status, bio, avatar_url, created_at FROM users WHERE id = ? LIMIT 1', [id]).then(r => r[0]),
  create: ({ name, email, password_hash, role = 'user' }) =>
    query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, password_hash, role]),
  updateStatus: (id, status) => query('UPDATE users SET status = ? WHERE id = ?', [status, id]),
  updateRole: (id, role) => query('UPDATE users SET role = ? WHERE id = ?', [role, id]),
  updateProfile: (id, { name, bio, avatar_url }) =>
    query('UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?', [name, bio, avatar_url, id]),
  updatePassword: (id, hash) => query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]),
  countByRole: () => query('SELECT role, COUNT(*) AS count FROM users GROUP BY role'),

  getAll: ({ role, status, search, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conds = [], params = [];
    if (role)   { conds.push('role = ?');              params.push(role); }
    if (status) { conds.push('status = ?');            params.push(status); }
    if (search) { conds.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return Promise.all([
      query(`SELECT id, name, email, role, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      query(`SELECT COUNT(*) AS total FROM users ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },
};
