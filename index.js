const bot = require('./bot');
const logger = require('./logger');

logger.info('Инициализация бота...');

bot.startPolling();