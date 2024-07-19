const OpenAI = require('openai');
const moment = require('moment');
const fs = require('fs');
const logger = require('./logger');
const { openaiApiKey } = require('./config');

const openai = new OpenAI({ apiKey: openaiApiKey });
const promptTemplate = fs.readFileSync('prompts/promptTemplate.txt', 'utf8');

async function processMessage(message) {
    logger.info(`Обрабатываю сообщение: ${message}`);

    const prompt = `${promptTemplate}\nHere is my content:\n ${message}`;
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

module.exports = { processMessage };