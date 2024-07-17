const { createLogger, format, transports } = require('winston');
const { LOG_FILE } = require('./config');

const logger = createLogger({
    level: 'info', // Set the default logging level to debug
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
    ),
    transports: [
        new transports.File({ filename: LOG_FILE }),
        new transports.Console()
    ]
});

module.exports = logger;