module.exports = {
    apps: [
        {
            name: 'tg-assistant-second-brain',
            script: 'index.js',
            watch: true,
            env: {
                NODE_ENV: 'production',
                TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                BASE_DIR: process.env.BASE_DIR
            }
        }
    ]
};