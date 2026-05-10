const REQUIRED = [
  'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'JWT_REFRESH_SECRET', 'GEMINI_API_KEY',
];

export const validateEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[ENV] Missing required variables:\n  ${missing.join('\n  ')}\nCopy .env.example to .env and fill in all values.`);
    process.exit(1);
  }
};
