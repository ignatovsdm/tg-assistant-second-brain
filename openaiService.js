const OpenAI = require('openai');
const moment = require('moment');
const fs = require('fs');
const path = require('path');  // Добавлен импорт path
const logger = require('./logger');
const { openaiApiKey } = require('./config');
const { sanitizeFileName, ensureDirectoryExistence } = require('./utils');

const openai = new OpenAI({ apiKey: openaiApiKey });
const promptTemplatePath = 'prompts/youtube-video-summary.txt';

async function processMessage(message) {
    logger.info(`Обрабатываю сообщение: ${message}`);

    const promptTemplate = fs.readFileSync('prompts/promptTemplate.txt', 'utf8');
    const prompt = `${promptTemplate}\nHere is my content:\n ${message}`;
    logger.debug(`Prompt created for processing message`);

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
        const linksBlock = "### Links\n1.";
        if (!result.includes(linksBlock)) {
            logger.error(`Invalid response structure: missing ### Links block. Full response: ${result}`);
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

async function summarizeSubtitles(subtitles, videoTitle, summaryDir) {
    logger.debug(`Starting subtitle summarization for video: ${videoTitle}`);
    const promptTemplate = fs.readFileSync(promptTemplatePath, 'utf8');
    const prompt = promptTemplate.replace('{{subtitles}}', subtitles);
    logger.debug(`Prompt created for summarization`);

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

        logger.debug(`OpenAI Response for summarization: ${JSON.stringify(response)}`);
        const summary = response.choices[0].message.content;
        const sanitizedTitle = sanitizeFileName(videoTitle);
        const summaryFilePath = path.join(summaryDir, `summary|${sanitizedTitle}.md`);

        ensureDirectoryExistence(summaryDir);
        fs.writeFileSync(summaryFilePath, summary, 'utf8');

        logger.debug(`Summary saved to file: ${summaryFilePath}`);
        return summaryFilePath;
    } catch (error) {
        logger.error(`Error during summarization: ${error}`);
        throw error;
    }
}

module.exports = { processMessage, summarizeSubtitles };