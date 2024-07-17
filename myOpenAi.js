const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_BOT_TOKEN, BASE_DIR } = require('./config');
const MyOpenAi = require('./myOpenAi');
const logger = require('./logger');

class MyTelegram {
    constructor(token, openAiInstance) {
        this.bot = new TelegramBot(token, { polling: true });
        this.openAiInstance = openAiInstance;
        logger.debug('MyTelegram instance created');
        this.initializeBot();
    }

    initializeBot() {
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            logger.info(`Received message: ${text}`);
            logger.debug(`Message details: ${JSON.stringify(msg)}`);

            if (text.startsWith('/')) {
                this.bot.sendMessage(chatId, `Команда "${text}" получена. Файл не создан.`);
                logger.info(`Command received: ${text}`);
                return;
            }

            this.ensureDirectoryExistence(BASE_DIR);
            const sanitizedFileName = this.sanitizeFileName(text);
            logger.debug(`Sanitized file name: ${sanitizedFileName}`);

            try {
                const generatedContent = await this.openAiInstance.processMessage(text);
                const filePath = path.join(BASE_DIR, `${sanitizedFileName}.md`);
                fs.writeFileSync(filePath, generatedContent, 'utf8');
                logger.info(`Результат успешно сохранен в файл: ${filePath}`);
                logger.debug(`Generated file content: ${generatedContent}`);

                const responseMessage = `Идея отправлена в ChatGPT. Результат обработан. Файл сохранен с названием: ${sanitizedFileName}.md\n\nТело файла:\n${generatedContent}`;
                this.bot.sendMessage(chatId, responseMessage);
                logger.info(`File created and processed: ${filePath}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Произошла ошибка при обработке вашего сообщения.`);
                logger.error(`Error processing message: ${error}`);
            }
        });

        logger.info('Бот запущен...');
    }

    ensureDirectoryExistence(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logger.debug(`Directory created: ${dir}`);
        }
    }

    sanitizeFileName(name) {
        const sanitized = name.replace(/[^a-zA-Zа-яА-Я0-9-_ ]/g, '');
        logger.debug(`Sanitized file name: ${sanitized}`);
        return sanitized;
    }
}

module.exports = MyTelegram;