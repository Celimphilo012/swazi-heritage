import { query } from '../config/db.js';

const FIELDS = ['title', 'authors', 'abstract', 'publication_type', 'publication_year', 'keywords', 'file_url'];

export const PublicationsModel = {
  create: ({ title, authors, abstract, publication_type, publication_year, keywords, file_url, created_by }) =>
    query(
      `INSERT INTO publications (title, authors, abstract, publication_type, publication_year, keywords, file_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, authors ?? null, abstract ?? null, publication_type || 'article',
       publication_year ?? null, keywords ?? null, file_url ?? null, created_by],
    ),

  update: (id, data) =>
    query(
      `UPDATE publications SET ${FIELDS.map(f => `${f}=?`).join(', ')} WHERE id=?`,
      [...FIELDS.map(f => data[f] ?? null), id],
    ),

  updateStatus: (id, status, reviewed_by, rejection_note) =>
    query(
      `UPDATE publications SET status=?, reviewed_by=?, rejection_note=? WHERE id=?`,
      [status, reviewed_by ?? null, rejection_note ?? null, id],
    ),

  delete: (id) => query(`DELETE FROM publications WHERE id = ?`, [id]),

  findById: (id) =>
    query(
      `SELECT p.*, u.name AS author_name FROM publications p
       JOIN users u ON p.created_by = u.id WHERE p.id = ?`,
      [id],
    ).then(r => r[0]),

  findByCreator: (created_by) =>
    query(`SELECT * FROM publications WHERE created_by = ? ORDER BY created_at DESC`, [created_by]),

  getAllAdmin: ({ status, page = 1, limit = 15 } = {}) => {
    const offset = (page - 1) * limit;
    const where = status ? `WHERE p.status = ?` : '';
    const params = status ? [status] : [];
    return Promise.all([
      query(
        `SELECT p.*, u.name AS author_name FROM publications p
         JOIN users u ON p.created_by = u.id ${where}
         ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM publications p ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },

  incrementViews: (id) => query(`UPDATE publications SET view_count = view_count + 1 WHERE id = ?`, [id]),

  // 'search' uses a MySQL FULLTEXT MATCH...AGAINST for real relevance-ranked search
  // (the "mini Google Scholar" bit) rather than a LIKE scan, since title/authors/abstract/keywords
  // are all indexed together via the ft_search index.
  getPublished: ({ search, publication_type, page = 1, limit = 20 }) => {
    const offset = (page - 1) * limit;
    const conditions = [`p.status = 'published'`];
    const params = [];
    let scoreSelect = '';
    let orderBy = 'p.created_at DESC';

    if (search && search.trim()) {
      conditions.push(`MATCH(p.title, p.authors, p.abstract, p.keywords) AGAINST (? IN NATURAL LANGUAGE MODE)`);
      params.push(search.trim());
      scoreSelect = `, MATCH(p.title, p.authors, p.abstract, p.keywords) AGAINST (?) AS relevance`;
      orderBy = 'relevance DESC';
    }
    if (publication_type) { conditions.push(`p.publication_type = ?`); params.push(publication_type); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const scoreParams = search && search.trim() ? [search.trim()] : [];

    return Promise.all([
      query(
        `SELECT p.*, u.name AS author_name ${scoreSelect} FROM publications p
         JOIN users u ON p.created_by = u.id ${where}
         ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [...scoreParams, ...params, limit, offset],
      ),
      query(`SELECT COUNT(*) AS total FROM publications p ${where}`, params),
    ]).then(([rows, cnt]) => ({ rows, total: cnt[0].total }));
  },
};
