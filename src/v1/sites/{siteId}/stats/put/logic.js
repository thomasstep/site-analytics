const {
  addToStats,
  siteExists,
} = require('/opt/ports');

/**
 *
 * @param {string} siteId Site ID
 * @param {Object} stats
 * @param {string} stats.trackingItem Stat to track
 * @returns
 */
async function logic(siteId, stats) {
  const isSite = await siteExists(siteId);
  if (!isSite) {
    return;
  }

  await addToStats(siteId, stats);
}

module.exports = {
  logic,
};
