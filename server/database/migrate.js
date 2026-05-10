import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  console.log('Running migrations...');
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  const sql = readFileSync(path.join(__dirname, 'migrations', 'schema.sql'), 'utf8');
  await conn.query(sql);
  console.log('Schema applied.');

  const { seedAll } = await import('./seeds/runSeeds.js');
  await seedAll(conn);

  await conn.end();
  console.log('Done.');
  process.exit(0);
};

run().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
