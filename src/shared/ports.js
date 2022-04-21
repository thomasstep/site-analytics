const sites = require('/opt/database/sites');
const users = require('/opt/database/users');

async function createSite(userId) {
  const siteId = await sites.create(userId);
  await users.addSite(userId, siteId, users.listTypes.OWNER);
  return siteId;
}

async function createUser(userId) {
  await users.create(userId);
}

async function readUser(userId) {
  const userData = await users.read(userId);
  return userData;
}

module.exports = {
  createSite,
  createUser,
  readUser,
}