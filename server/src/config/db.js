import mysql from "mysql2/promise";
import logger from "../utils/logger.js";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
});

export const testConnection = async () => {
  const conn = await pool.getConnection();
  logger.info(`MySQL connected — database: ${process.env.DB_NAME}`);
  conn.release();
};

// mysql2 throws a hard error if any param is `undefined`.
// Mapping undefined -> null means missing optional fields become SQL NULL
// instead of crashing the server.
export const query = async (sql, params = []) => {
  const safe = params.map((p) => (p === undefined ? null : p));
  const [rows] = await pool.execute(sql, safe);
  return rows;
};

export const getConnection = () => pool.getConnection();
export default pool;
