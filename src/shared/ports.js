const sites = require('/opt/database/sites');
const users = require('/opt/database/users');
const {
  MissingResourceError,
  UnauthorizedError,
} = require('/opt/errors');

/**
 * @enum {OperationTypes}
 */
const operationTypes = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
};

/**
 * Returns site data if the authorization is successful.
 * Throws an error if the user is unauthorized.
 *
 * @param {string} uniqueId
 * @param {string} siteId
 * @param {OperationTypes} operation
 * @returns {Object} siteData
 */
async function authorizeUserForSite(uniqueId, siteId, operation) {
  const siteData = await sites.read(siteId);
  if (!siteData.id) {
    throw new MissingResourceError('Site not found');
  }

  let isAuthorized = false;
  if (uniqueId === siteData.owner) {
    isAuthorized = true;
  }

  const listsToCheck = [];
  if (operation === operationTypes.READ) {
    listsToCheck.push(siteData.admins);
    listsToCheck.push(siteData.writers);
    listsToCheck.push(siteData.readers);
  }

  if (operation === operationTypes.WRITE) {
    listsToCheck.push(siteData.admins);
    listsToCheck.push(siteData.writers);
  }

  if (operation === operationTypes.DELETE) {
    // Only the owner can delete
  }

  listsToCheck.forEach((list) => {
    if (list && list.has(uniqueId)) {
      isAuthorized = true;
    }
  });

  if (isAuthorized) {
    return siteData;
  }

  throw new UnauthorizedError('User unauthorized for this operation.', {
    uniqueId,
    siteId,
    operation,
  });
}

async function addToStats(siteId, stats) {
  await sites.addToStats(siteId, stats);
}

async function createSite(uniqueId, url, name) {
  const siteId = await sites.create(uniqueId, url, name);
  await users.addSite(uniqueId, siteId, users.listTypes.OWNER);
  return siteId;
}

async function createUser(uniqueId) {
  await users.create(uniqueId);
}

async function readFromStats(uniqueId, siteId, startDate, endDate) {
  await authorizeUserForSite(uniqueId, siteId);
  const statsByDate = sites.readStatsByDate(siteId, startDate, endDate);
  return statsByDate;
}

async function readSite(uniqueId, siteId) {
  const siteData = await authorizeUserForSite(uniqueId, siteId);
  return siteData;
}

async function readUser(uniqueId) {
  const userData = await users.read(uniqueId);
  return userData;
}

async function deleteSite(uniqueId, siteId) {
  await authorizeUserForSite(uniqueId, siteId);
  await Promise.all([
    sites.remove(siteId),
    users.removeSite(uniqueId, siteId, users.listTypes.OWNER),
  ]);
}

async function siteExists(siteId) {
  const siteData = await sites.read(siteId);
  if (siteData.id) {
    return true;
  }

  return false;
}

module.exports = {
  addToStats,
  createSite,
  createUser,
  readFromStats,
  readSite,
  readUser,
  deleteSite,
  siteExists,
};
