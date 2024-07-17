const OpenAI = require('openai');
const moment = require('moment');
const { OPENAI_API_KEY, PROMPT_TEMPLATE } = require('./config');

class MyOpenAi {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey });
    }

    async processMessage(message) {
        console.log(`Обрабатываю сообщение: ${message}`);

        const prompt = `${PROMPT_TEMPLATE} ${message}`;
        console.log(`Prompt: ${prompt}`);

        try {
            const response = await this.openai.chat.completions.create({
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

            console.log(`OpenAI Response: ${JSON.stringify(response)}`);
            let result = response.choices[0].message.content;
            console.log(`Generated content: ${result}`);

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
            console.error(`Ошибка при обработке сообщения ${message}:`, error);
            throw error;
        }
    }
}

module.exports = MyOpenAi;