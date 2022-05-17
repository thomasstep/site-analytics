const { logic } = require('./logic');

/**
 *
 * @param {Object} auth Holds relevant authentication info
 * @param {string} auth.uniqueId Unique ID of the client
 * @param {Object} payload Holds relevant information
 * @param {string} payload.url URL for website
 * @param {Object} payload.name (Optional) Name for website
 * @returns
 */
async function port(auth, payload) {
  const {
    url,
    name,
  } = payload;
  const id = await logic(auth, url, name);
  return id;
}

module.exports = {
  port,
};
