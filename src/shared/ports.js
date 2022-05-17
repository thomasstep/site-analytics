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

async function createSite(uniqueId, url, name) {
  const siteId = await sites.create(uniqueId, url, name);
  await users.addSite(uniqueId, siteId, users.listTypes.OWNER);
  return siteId;
}

async function createUser(uniqueId) {
  await users.create(uniqueId);
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
  // TODO make final two calls parallel
  await sites.remove(siteId);
  await users.removeSite(uniqueId, siteId, users.listTypes.OWNER);
}

module.exports = {
  createSite,
  createUser,
  readSite,
  readUser,
  deleteSite,
};
