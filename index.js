const { TELEGRAM_BOT_TOKEN, OPENAI_API_KEY } = require('./config');
const MyOpenAi = require('./myOpenAi');
const MyTelegram = require('./myTelegram');

const openAiInstance = new MyOpenAi(OPENAI_API_KEY);
const telegramBot = new MyTelegram(TELEGRAM_BOT_TOKEN, openAiInstance);