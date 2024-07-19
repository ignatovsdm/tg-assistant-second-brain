const { exec } = require('child_process');
const moment = require('moment');
const logger = require('./logger');
const { gitRepoDir } = require('./config');

function executeGitCommands(fileName) {
    const commitMessage = `${moment().format('YYYY-MM-DD HH:mm')} Commit from bot`;
    const commands = `
        cd ${gitRepoDir} &&
        git pull origin master &&
        git add . &&
        git commit -m "${commitMessage}" &&
        git push origin master
    `;

    exec(commands, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Ошибка выполнения Git команд: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.error(`Git stderr: ${stderr}`);
        }
        logger.info(`Git stdout: ${stdout}`);
        logger.info(`Git sync finished`);
    });
}

module.exports = { executeGitCommands };