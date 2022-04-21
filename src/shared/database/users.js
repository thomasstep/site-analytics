const { documentClient } = require('./databaseSession');
const {
  PRIMARY_TABLE_NAME: TableName,
  USER_SORT_KEY: secondaryId,
} = require('/opt/config');

/**
 * @enum {SiteListTypes}
 */
const listTypes = {
  OWNER: 'owner',
  ADMIN: 'admin',
  WRITER: 'writer',
  READER: 'reader',
};

/**
 *
 * @param {string} id Internal prefix which is the user's unique ID
 * @param {string} siteId ID of new site
 * @param {SiteListTypes} list Site list to add to
 */
 async function addSite(id, siteId, list) {
  const updateParams = {
    UpdateExpression: 'ADD #siteList :siteId',
    ExpressionAttributeNames: {
      '#siteList': list,
    },
    ExpressionAttributeValues: {
      ':siteId': new Set([siteId]),
    },
  }
  await update(id, updateParams);
}

/**
 *
 * @param {string} id Internal prefix which is the user's unique ID
 * @param {string} siteId ID of new site
 * @param {SiteListTypes} list Site list to add to
 */
 async function removeSite(id, siteId, list) {
  const updateParams = {
    UpdateExpression: 'DELETE #siteList :siteId',
    ExpressionAttributeNames: {
      '#siteList': list,
    },
    ExpressionAttributeValues: {
      ':siteId': new Set([siteId]),
    },
  }
  await update(id, updateParams);
}

/**
 *
 * @param {string} id User ID
 * @returns
 */
 async function create(id) {
  const now = new Date();
  await documentClient.put({
    TableName,
    Item: {
      id,
      secondaryId,
      owner: new Set([]),
      admin: new Set([]),
      writer: new Set([]),
      reader: new Set([]),
      created: now.toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(id)',
  });

  return;
}

/**
 *
 * @param {*} id User ID to read
 * @returns {Object} userData
 *                   {
 *                   owner: string[],
 *                   admin: string[],
 *                   writer: string[],
 *                   reader: string[],
 *                   created: timestamp
 *                   }
 */
async function read(id) {
  const user = await documentClient.get({
    TableName,
    Key: {
      id,
      secondaryId,
    },
  });
  if (!user.Item) {
    return {};
  }

  const {
    secondaryId,
    ...userData
  } = user.Item;
  return userData;
}

/**
 *
 * @param {string} id Calendar ID
 * @param {Object} updateParams Payload for updates
 * @param {Object} updateParams.UpdateExpression
 * @param {Object} updateParams.ExpressionAttributeNames
 * @param {Object} updateParams.ExpressionAttributeValues
 * @returns
 */
async function update(id, updateParams) {
  await documentClient.update({
    TableName,
    Key: {
      id,
      secondaryId,
    },
    ...updateParams,
  });
  return;
}

module.exports = {
  listTypes,
  addSite,
  removeSite,
  create,
  read,
};
