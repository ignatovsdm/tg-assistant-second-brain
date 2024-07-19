const dotenv = require('dotenv');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const fs = require('fs');
const logger = require('./logger');
const { processMessage } = require('./openaiService');
const { executeGitCommands } = require('./gitService');
const { ensureDirectoryExistence, sanitizeFileName } = require('./utils');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const baseDir = process.env.BASE_DIR;

function startPolling() {
    bot.startPolling();

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        logger.info(`Received message: ${text}`);

        if (text.startsWith('/')) {
            bot.sendMessage(chatId, `Команда "${text}" получена. Файл не создан.`);
            logger.info(`Command received: ${text}`);
            return;
        }

        ensureDirectoryExistence(baseDir);
        const sanitizedFileName = sanitizeFileName(text);
        logger.info(`Sanitized file name: ${sanitizedFileName}`);

        try {
            const generatedContent = await processMessage(text);

            if (text.length > 230) {
                // Logic for long messages
                const dateFileName = moment().format('DD-MM-YYYY');
                const dateFilePath = path.join(baseDir, `${dateFileName}.md`);

                const contentToSave = `${text}\n\n${generatedContent}`;

                if (fs.existsSync(dateFilePath)) {
                    fs.appendFileSync(dateFilePath, `\n\n${contentToSave}`, 'utf8');
                    logger.info(`Результат успешно дополнен в файл: ${dateFilePath}`);
                } else {
                    fs.writeFileSync(dateFilePath, contentToSave, 'utf8');
                    logger.info(`Результат успешно сохранен в новый файл: ${dateFilePath}`);
                }

                executeGitCommands(dateFileName);
                const responseMessage = `Идея отправлена в ChatGPT. Результат обработан. Файл сохранен с названием: ${dateFileName}.md\n\nТело файла:\n${contentToSave}`;
                bot.sendMessage(chatId, responseMessage);
                logger.info(`File created and processed: ${dateFilePath}`);
            } else {
                // Logic for short messages
                const filePath = path.join(baseDir, `${sanitizedFileName}.md`);
                fs.writeFileSync(filePath, generatedContent, 'utf8');
                logger.info(`Результат успешно сохранен в файл: ${filePath}`);

                executeGitCommands(sanitizedFileName);
                const responseMessage = `Идея отправлена в ChatGPT. Результат обработан. Файл сохранен с названием: ${sanitizedFileName}.md\n\nТело файла:\n${generatedContent}`;
                bot.sendMessage(chatId, responseMessage);
                logger.info(`File created and processed: ${filePath}`);
            }
        } catch (error) {
            bot.sendMessage(chatId, `Произошла ошибка при обработке вашего сообщения.`);
            logger.error(`Error processing file: ${error}`);
        }
    });

    logger.info('Бот запущен...');
}

module.exports = { startPolling };