const fs = require('fs');

function ensureDirectoryExistence(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Zа-яА-Я0-9-_ ]/g, '');
}

module.exports = { ensureDirectoryExistence, sanitizeFileName };