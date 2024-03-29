const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { createSite } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(auth, url, name) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while creating site', auth);
  }

  const siteId = await createSite(uniqueId, url, name);
  return siteId;
}

module.exports = {
  logic,
};
