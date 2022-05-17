const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { logger } = require('/opt/logger');
const { readUser } = require('/opt/ports');

/**
 * Business logic
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @returns {string}
 */

async function logic(auth) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found', auth);
  }

  const userData = await readUser(uniqueId);
  const {
    owner = [],
    admin = [],
    writer = [],
    reader = [],
  } = userData;

  const sites = {
    owner: Array.from(owner),
    admin: Array.from(admin),
    writer: Array.from(writer),
    reader: Array.from(reader),
  };

  return sites;
}

module.exports = {
  logic,
};
