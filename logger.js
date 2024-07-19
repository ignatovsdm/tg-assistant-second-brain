const winston = require('winston');
const { logLevel } = require('./config');

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'bot.log' }),
        new winston.transports.Console()
    ]
});

module.exports = logger;