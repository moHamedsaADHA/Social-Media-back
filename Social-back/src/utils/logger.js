import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const loggerTransports = [
  new transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
  }),
];

if (process.env.NODE_ENV !== 'production') {
  loggerTransports.push(
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`),
      ),
    }),
  );
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: loggerTransports,
});

export default logger;