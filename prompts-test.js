const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testPrompt(promptFilePath, inputFilePath, outputFilePath) {
    try {
        // Чтение содержимого промпта и входного файла
        const promptTemplate = fs.readFileSync(promptFilePath, 'utf8');
        const inputContent = fs.readFileSync(inputFilePath, 'utf8');

        // Замена плейсхолдера в промпте на содержимое входного файла
        const prompt = promptTemplate.replace('{{subtitles}}', inputContent);

        logger.info('Executing prompt...');

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

        // Логирование и вывод результата
        logger.debug(`OpenAI Response: ${JSON.stringify(response)}`);
        const result = response.choices[0].message.content;
        console.log(result);

        // Сохранение результата в файл
        fs.writeFileSync(outputFilePath, result, 'utf8');
        logger.info(`Result saved to ${outputFilePath}`);
    } catch (error) {
        logger.error('Error during prompt execution:', error);
    }
}

// Пример использования
const promptFilePath = path.join(__dirname, 'prompts', 'part_analysis.txt');
const inputFilePath = path.join(__dirname, 'sub.md');
const outputFilePath = path.join(__dirname, 'test-result.md');

testPrompt(promptFilePath, inputFilePath, outputFilePath);