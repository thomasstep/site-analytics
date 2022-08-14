const { logic } = require('./logic');

async function port(siteId, stats) {
  await logic(siteId, stats);
}

module.exports = {
  port,
};
