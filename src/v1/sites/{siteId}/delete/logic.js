const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { deleteSite } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @param {string} siteId Site ID to be deleted
 * @returns {string}
 */

async function logic(auth, siteId) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while deleting site', auth);
  }

  await deleteSite(uniqueId, siteId);
}

module.exports = {
  logic,
};
