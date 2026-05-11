import { query } from "../config/db.js";

export const UserModel = {
  findByEmail: (email) =>
    query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]).then(
      (r) => r[0],
    ),

  findById: (id) =>
    query(
      "SELECT id, name, email, role, status, bio, avatar_url, created_at FROM users WHERE id = ? LIMIT 1",
      [id],
    ).then((r) => r[0]),

  create: ({ name, email, password_hash, role = "user" }) =>
    query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role],
    ),

  // Admin: update all fields at once
  updateFull: (id, { name, email, role, status }) =>
    query(
      "UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?",
      [name, email, role, status, id],
    ),

  updateStatus: (id, status) =>
    query("UPDATE users SET status = ? WHERE id = ?", [status, id]),

  updateRole: (id, role) =>
    query("UPDATE users SET role = ? WHERE id = ?", [role, id]),

  updateProfile: (id, { name, bio, avatar_url }) =>
    query("UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?", [
      name,
      bio,
      avatar_url,
      id,
    ]),

  updatePassword: (id, password_hash) =>
    query("UPDATE users SET password_hash = ? WHERE id = ?", [
      password_hash,
      id,
    ]),

  delete: (id) => query("DELETE FROM users WHERE id = ?", [id]),

  getAll: ({ role, status, search, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conditions = [],
      params = [];
    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return Promise.all([
      query(
        `SELECT id, name, email, role, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM users ${where}`, params),
    ]).then(([rows, count]) => ({ rows, total: count[0].total }));
  },

  countByRole: () =>
    query("SELECT role, COUNT(*) AS count FROM users GROUP BY role"),
};
