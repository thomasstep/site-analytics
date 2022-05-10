const { logic } = require('./logic');

async function port(auth, siteId) {
  const siteData = await logic(auth, siteId);
  return siteData;
}

module.exports = {
  port,
};
