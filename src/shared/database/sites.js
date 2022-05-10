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
async function create(owner, url, name) {
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
      name: name || url,
      url,
      created: now.toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return newSiteId;
}

/**
 *
 * @param {*} id Site ID to read
 * @returns {Object} siteData
 *                   {
 *                     id: string,
 *                     owner: string,
 *                     admins: string[],
 *                     writers: string[],
 *                     readers: string[],
 *                     readers: string[],
 *                     name: string,
 *                     url: string,
 *                     created: timestamp
 *                   }
 */
async function read(id) {
  const site = await documentClient.get({
    TableName,
    Key: {
      id,
      secondaryId: siteSecondaryId,
    },
  });
  if (!site.Item) {
    return {};
  }

  const {
    secondaryId,
    ...siteData
  } = site.Item;
  return siteData;
}

/**
 *
 * @param {string} id Site ID to be deleted
 */
async function remove(id) {
  await documentClient.delete({
    TableName,
    Key: {
      id,
      secondaryId: siteSecondaryId,
    },
  });
}

module.exports = {
  create,
  read,
  remove,
};
