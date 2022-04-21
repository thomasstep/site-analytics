const { documentClient } = require('./databaseSession');
const {
  PRIMARY_TABLE_NAME: TableName,
  SITE_SORT_KEY: siteSecondaryId,
  STATS_SORT_KEY: statsSecondaryId,
} = require('/opt/config');
const { generateToken } = require('/opt/generateToken');

/**
 *
 * @param {string} owner User ID for the owner
 * @returns {string} Site's ID
 */
async function create(owner, url) {
  const newSiteId = generateToken();
  const now = new Date();
  await documentClient.put({
    TableName,
    Item: {
      id: newSiteId,
      secondaryId: siteSecondaryId,
      owner,
      admins: new Set([]),
      writers: new Set([]),
      readers: new Set([]),
      emails: new Set([]),
      name: url,
      url,
      created: now.toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return newSiteId;
}

module.exports = {
  create,
};