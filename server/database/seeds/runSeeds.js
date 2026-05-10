import bcrypt from 'bcryptjs';

export const seedAll = async (conn) => {
  console.log('Seeding...');

  // Admin account
  const [ex] = await conn.query("SELECT id FROM users WHERE email = 'admin@swaziheritage.sz'");
  if (!ex.length) {
    const hash = await bcrypt.hash('Admin@1234', 12);
    await conn.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
      ['Platform Admin', 'admin@swaziheritage.sz', hash]);
    console.log('  Admin created: admin@swaziheritage.sz / Admin@1234');
    console.log('  CHANGE THIS PASSWORD after first login!');
  }

  // Imvunulo presets
  const presets = [
    { name: 'Umutsha',       description: 'Traditional male front covering made from animal skin', gender: 'male' },
    { name: 'Emahiya',       description: 'Colourful cloth wrap worn by women at ceremonies',       gender: 'female' },
    { name: 'Sikhamba',      description: 'Beaded necklace worn as part of ceremonial dress',       gender: 'both' },
    { name: 'Ligcebesha',    description: 'Small beaded skirt worn by young unmarried women',       gender: 'female' },
    { name: 'Emajobo',       description: 'Animal skin skirt worn by men during ceremonies',        gender: 'male' },
    { name: 'Injobo',        description: 'Long cloth worn around the waist during royal ceremonies', gender: 'both' },
    { name: 'Umhlalo',       description: 'Red ochre body paint applied for ceremonies',            gender: 'both' },
    { name: 'Libhande',      description: 'Headband worn by married women',                         gender: 'female' },
    { name: 'Lwamba',        description: 'Shield carried by men during warrior ceremonies',        gender: 'male' },
    { name: 'Imishokobezi',  description: 'Decorative ankle rattles worn during dances',            gender: 'both' },
  ];
  for (const p of presets)
    await conn.query('INSERT IGNORE INTO imvunulo_presets (name, description, gender) VALUES (?, ?, ?)',
      [p.name, p.description, p.gender]);
  console.log(`  ${presets.length} imvunulo presets seeded.`);

  // System config
  const configs = [
    {
      config_key: 'ai_system_prompt',
      description: 'System prompt prepended to every Gemini AI call',
      value: `You are a knowledgeable and respectful cultural assistant for the Kingdom of Eswatini (Swaziland).
Your role is to help users understand Swazi traditions, royal ceremonies, clan lineages,
traditional attire (imvunulo), and cultural practices.
Use the provided platform data as your primary source.
If the data does not cover the question, draw on general Swazi cultural knowledge and say: "Based on general knowledge:"
Always be respectful of Swazi culture and the royal family.
Do not fabricate ceremony names, clan names, or royal figures.`,
    },
    { config_key: 'platform_name',   description: 'Display name',              value: 'Swazi Cultural Heritage Platform' },
    { config_key: 'ceremony_months', description: 'Selectable ceremony periods', value: JSON.stringify([
        'January','February','March','April','May','June',
        'July','August','September','October','November','December',
        'Incwala season (December–January)',
        'Umhlanga season (August–September)',
      ]) },
  ];
  for (const c of configs)
    await conn.query('INSERT IGNORE INTO system_config (config_key, value, description) VALUES (?, ?, ?)',
      [c.config_key, c.value, c.description]);
  console.log(`  ${configs.length} config entries seeded.`);
};
