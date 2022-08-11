const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { readSite } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @param {string} siteId Site ID
 * @returns {Object}
 */

async function logic(auth, siteId) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while reading site', auth);
  }

  const siteData = await readSite(uniqueId, siteId);

  const {
    admins = [],
    writers = [],
    readers = [],
  } = siteData;
  siteData.admins = Array.from(admins);
  siteData.writers = Array.from(writers);
  siteData.readers = Array.from(readers);

  return siteData;
}

module.exports = {
  logic,
};
