const { logic } = require('./logic');

async function port(siteId, stats) {
  // TODO Validate
  await logic(siteId, stats);
}

module.exports = {
  port,
};
