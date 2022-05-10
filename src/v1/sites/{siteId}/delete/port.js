const { logic } = require('./logic');

async function port(auth, siteId) {
  await logic(auth, siteId);
}

module.exports = {
  port,
};
