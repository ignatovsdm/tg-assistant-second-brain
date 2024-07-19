const OpenAI = require('openai');
const moment = require('moment');
const fs = require('fs');

const path = require('path');

const logger = require('./logger');
const { openaiApiKey } = require('./config');
const { sanitizeFileName, ensureDirectoryExistence } = require('./utils');

const openai = new OpenAI({ apiKey: openaiApiKey });
const promptTemplatePath = 'prompts/youtube-video-summary.txt';
const partAnalysisTemplatePath = 'prompts/part_analysis.txt';
const fullSummaryTemplatePath = 'prompts/full_summary.txt';
const TOKEN_LIMIT = 25000; // Добавлено объявление переменной

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

async function analyzeChunk(content, templatePath) {
    const promptTemplate = fs.readFileSync(templatePath, 'utf8');
    const prompt = promptTemplate.replace('{{subtitles}}', content);

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

    return response.choices[0].message.content;
}

async function summarizeSubtitles(subtitles, videoTitle, summaryDir) {
    logger.debug(`Starting subtitle summarization for video: ${videoTitle}`);

    const chunks = splitIntoChunks(subtitles, TOKEN_LIMIT);
    const sanitizedTitle = sanitizeFileName(videoTitle);
    const partResults = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        logger.debug(`Analyzing chunk ${i + 1}/${chunks.length}`);
        const partResult = await analyzeChunk(chunk, partAnalysisTemplatePath);
        partResults.push(partResult);
        logger.debug(`Chunk ${i + 1} analysis completed`);
    }

    const combinedSummary = partResults.join('\n\n');
    const intermediateFilePath = path.join(summaryDir, `intermediate-summary|${sanitizedTitle}.md`);
    fs.writeFileSync(intermediateFilePath, combinedSummary, 'utf8');
    logger.debug(`Intermediate summary saved to file: ${intermediateFilePath}`);

    const finalSummary = await analyzeChunk(combinedSummary, fullSummaryTemplatePath);
    const finalFilePath = path.join(summaryDir, `full-summary|${sanitizedTitle}.md`);
    fs.writeFileSync(finalFilePath, finalSummary, 'utf8');
    logger.debug(`Final summary saved to file: ${finalFilePath}`);

    return finalFilePath;
}

function splitIntoChunks(text, chunkSize) {
    const chunks = [];
    let currentChunk = '';

    text.split('\n').forEach(line => {
        if ((currentChunk.length + line.length) <= chunkSize) {
            currentChunk += line + '\n';
        } else {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
        }
    });

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

module.exports = { processMessage, summarizeSubtitles };