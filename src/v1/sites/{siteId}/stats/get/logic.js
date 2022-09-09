const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { readFromStats } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(auth, siteId, categories, startDate, endDate) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while reading stats', auth);
  }

  const statsByDate = await readFromStats(uniqueId, siteId, categories, startDate, endDate);
  return statsByDate;
}

module.exports = {
  logic,
};
