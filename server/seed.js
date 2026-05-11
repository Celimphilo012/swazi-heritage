// ─────────────────────────────────────────────────────────────────────────────
//  Swazi Heritage — Database Seeder
//  Place this file in your server/ folder and run:
//    node seed.js
//  Make sure your server/.env is filled in first.
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const conn = await mysql.createConnection({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'swazi_heritage',
});

console.log('\n🌱  Seeding swazi_heritage database...\n');

// ─── 1. Admin account ─────────────────────────────────────────────────────────
const [existing] = await conn.query(
  "SELECT id FROM users WHERE email = 'admin@swaziheritage.sz'"
);

if (existing.length) {
  console.log('  ✓ Admin account already exists — skipping.');
} else {
  const hash = await bcrypt.hash('Admin@1234', 12);
  await conn.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    ['Platform Admin', 'admin@swaziheritage.sz', hash]
  );
  console.log('  ✓ Admin created');
  console.log('    email:    admin@swaziheritage.sz');
  console.log('    password: Admin@1234');
  console.log('    ⚠  Change this password after first login!\n');
}

// ─── 2. Imvunulo presets ──────────────────────────────────────────────────────
const presets = [
  { name: 'Umutsha',      description: 'Traditional male front covering made from animal skin',      gender: 'male'   },
  { name: 'Emahiya',      description: 'Colourful cloth wrap worn by women at ceremonies',            gender: 'female' },
  { name: 'Sikhamba',     description: 'Beaded necklace worn as part of ceremonial dress',            gender: 'both'   },
  { name: 'Ligcebesha',   description: 'Small beaded skirt worn by young unmarried women',            gender: 'female' },
  { name: 'Emajobo',      description: 'Animal skin skirt worn by men during ceremonies',             gender: 'male'   },
  { name: 'Injobo',       description: 'Long cloth worn around the waist during royal ceremonies',    gender: 'both'   },
  { name: 'Umhlalo',      description: 'Red ochre body paint applied for ceremonies',                 gender: 'both'   },
  { name: 'Libhande',     description: 'Headband worn by married women',                              gender: 'female' },
  { name: 'Lwamba',       description: 'Shield carried by men during warrior ceremonies',             gender: 'male'   },
  { name: 'Imishokobezi', description: 'Decorative ankle rattles worn during dances',                 gender: 'both'   },
];

let inserted = 0;
for (const p of presets) {
  const [r] = await conn.query(
    'INSERT IGNORE INTO imvunulo_presets (name, description, gender) VALUES (?, ?, ?)',
    [p.name, p.description, p.gender]
  );
  if (r.affectedRows) inserted++;
}
console.log(`  ✓ Imvunulo presets: ${inserted} inserted, ${presets.length - inserted} already existed`);

// ─── 3. System config ─────────────────────────────────────────────────────────
// Note: column is named `key` in system_config (backtick-quoted because it's a reserved word)
const configs = [
  {
    key: 'ai_system_prompt',
    description: 'System prompt prepended to every Gemini AI call',
    value:
`You are a knowledgeable and respectful cultural assistant for the Kingdom of Eswatini (Swaziland).
Your role is to help users understand Swazi traditions, royal ceremonies, clan lineages,
traditional attire (imvunulo), and cultural practices.
Use the provided platform data as your primary source.
If the data does not cover the question, draw on general Swazi cultural knowledge and say: "Based on general knowledge:"
Always be respectful of Swazi culture and the royal family.
Do not fabricate ceremony names, clan names, or royal figures.`,
  },
  {
    key: 'platform_name',
    description: 'Display name of the platform',
    value: 'Swazi Cultural Heritage Platform',
  },
  {
    key: 'ceremony_months',
    description: 'Selectable time periods for ceremony scheduling',
    value: JSON.stringify([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
      'Incwala season (December–January)',
      'Umhlanga season (August–September)',
    ]),
  },
];

let configInserted = 0;
for (const c of configs) {
  const [r] = await conn.query(
    'INSERT IGNORE INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
    [c.key, c.value, c.description]
  );
  if (r.affectedRows) configInserted++;
}
console.log(`  ✓ System config: ${configInserted} inserted, ${configs.length - configInserted} already existed`);

await conn.end();

console.log('\n✅  Seeding complete.\n');
console.log('  Start your server:  npm run dev');
console.log('  Then open:          http://localhost:5173\n');
