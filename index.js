const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const moment = require('moment');
const winston = require('winston');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const baseDir = process.env.BASE_DIR;
const logLevel = process.env.LOG_LEVEL || 'info';

const promptTemplate = `
As input you receive a text string. Your task is to form up to 5 main tags for the received text, which convey the meaning of what is being discussed as fully as possible. You can use some other word that is the most matches the meaning of the text phrase.
Several rules for forming tags:
1) Try to use a word with one letter
2) Return all tags in lowercase letters
Next, you need to pack these tags into a template document:

Do not modify the following lines:
Created: {{date:YYYY-MM-DD}} {{time:HH:mm}}
Tags: # 

---

### Reference
1. 

### Zero Links
1. [[00 ]]
2. [[00 ]]
3. [[00 ]]
4. [[00 ]]
5. [[00 ]]

### Links
1. 

You need to change only the ### Zero Links block in the template. You need to insert the generated tags into it. Like [[00 Tag]].

Do not add anything to the ### Links block. Do not include the input text or any other content.

Return the original received template with the Zero Links block filled in. Never write anything unnecessary as a result, besides what did I ask for.
you cannot return the result in a structure different from the given template.
Write tags only in Russian.
Template:
Created: {{date:YYYY-MM-DD}} {{time:HH:mm}}
Tags: # 

---

### Reference
1. 

### Zero Links
1. [[00 ]]
2. [[00 ]]
3. [[00 ]]
4. [[00 ]]
5. [[00 ]]

### Links
1. `;

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

function ensureDirectoryExistence(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Zа-яА-Я0-9-_ ]/g, '');
}

async function processMessage(message) {
    logger.info(`Обрабатываю сообщение: ${message}`);

    const prompt = `${promptTemplate} ${message}`;
    logger.debug(`Prompt: ${prompt}`);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        logger.debug(`OpenAI Response: ${JSON.stringify(response)}`);
        let result = response.choices[0].message.content;
        logger.debug(`Generated content: ${result}`);

        // Validate and ensure that ### Links block is unchanged
        const linksBlock = "### Links\n1. ";
        if (!result.includes(linksBlock)) {
            throw new Error("Invalid response structure: missing ### Links block");
        }

        const [contentBeforeLinks] = result.split(linksBlock);
        result = `${contentBeforeLinks}${linksBlock}`;

        const currentDate = moment().format('YYYY-MM-DD');
        const currentTime = moment().format('HH:mm');

        result = result.replace('{{date:YYYY-MM-DD}}', currentDate).replace('{{time:HH:mm}}', currentTime);

        return result;
    } catch (error) {
        logger.error(`Ошибка при обработке сообщения ${message}: ${error}`);
        throw error;
    }
}

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
        const filePath = path.join(baseDir, `${sanitizedFileName}.md`);
        fs.writeFileSync(filePath, generatedContent, 'utf8');
        logger.info(`Результат успешно сохранен в файл: ${filePath}`);

        const responseMessage = `Идея отправлена в ChatGPT. Результат обработан. Файл сохранен с названием: ${sanitizedFileName}.md\n\nТело файла:\n${generatedContent}`;
        bot.sendMessage(chatId, responseMessage);
        logger.info(`File created and processed: ${filePath}`);
    } catch (error) {
        bot.sendMessage(chatId, `Произошла ошибка при обработке вашего сообщения.`);
        logger.error(`Error processing file: ${error}`);
    }
});

logger.info('Бот запущен...');