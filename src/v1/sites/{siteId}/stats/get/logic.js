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

async function logic(auth, siteId, startDate, endDate) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while creating calendar', auth);
  }

  const statsByDate = await readFromStats(uniqueId, siteId, startDate, endDate);
  return statsByDate;
}

module.exports = {
  logic,
};
