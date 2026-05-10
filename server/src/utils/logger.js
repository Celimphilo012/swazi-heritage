import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;

const dev = combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) =>
    `${timestamp} [${level}] ${stack || message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
  ));

const prod = combine(timestamp(), errors({ stack: true }), winston.format.json());

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prod : dev,
  transports: [new winston.transports.Console()],
});

export default logger;
