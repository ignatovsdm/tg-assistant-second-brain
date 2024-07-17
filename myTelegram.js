const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { TELEGRAM_BOT_TOKEN, BASE_DIR } = require('./config');
const MyOpenAi = require('./myOpenAi');

class MyTelegram {
    constructor(token, openAiInstance) {
        this.bot = new TelegramBot(token, { polling: true });
        this.openAiInstance = openAiInstance;
        this.initializeBot();
    }

    initializeBot() {
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            console.log(`Received message: ${text}`);

            if (text.startsWith('/')) {
                this.bot.sendMessage(chatId, `Команда "${text}" получена. Файл не создан.`);
                console.log(`Command received: ${text}`);
                return;
            }

            this.ensureDirectoryExistence(BASE_DIR);
            const sanitizedFileName = this.sanitizeFileName(text);
            console.log(`Sanitized file name: ${sanitizedFileName}`);

            try {
                const generatedContent = await this.openAiInstance.processMessage(text);
                const filePath = path.join(BASE_DIR, `${sanitizedFileName}.md`);
                fs.writeFileSync(filePath, generatedContent, 'utf8');
                console.log(`Результат успешно сохранен в файл: ${filePath}`);

                const responseMessage = `Идея отправлена в ChatGPT. Результат обработан. Файл сохранен с названием: ${sanitizedFileName}.md\n\nТело файла:\n${generatedContent}`;
                this.bot.sendMessage(chatId, responseMessage);
                console.log(`File created and processed: ${filePath}`);
            } catch (error) {
                this.bot.sendMessage(chatId, `Произошла ошибка при обработке вашего сообщения.`);
            }
        });

        console.log('Бот запущен...');
    }

    ensureDirectoryExistence(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    sanitizeFileName(name) {
        return name.replace(/[^a-zA-Zа-яА-Я0-9-_ ]/g, '');
    }
}

module.exports = MyTelegram;