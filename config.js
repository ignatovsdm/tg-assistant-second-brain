const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    baseDir: process.env.BASE_DIR,
    logLevel: process.env.LOG_LEVEL || 'info',
    gitRepoDir: process.env.GIT_REPO_DIR
};