const {
  MissingUniqueIdError,
} = require('/opt/errors');
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
    throw new MissingUniqueIdError('Unique ID not found while creating calendar', auth);
  }

  const userData = await readUser(uniqueId);
  const sites = {
    owner: userData.owner,
    admin: userData.admin,
    writer: userData.writer,
    reader: userData.reader,
  };
  return sites;
}

module.exports = {
  logic,
};
