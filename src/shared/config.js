const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

module.exports = config;