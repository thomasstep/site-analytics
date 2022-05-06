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

exports.logic = async function (auth, siteId) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while creating calendar', auth);
  }

  const siteData = await readSite(uniqueId, siteId);

  return siteData;
}