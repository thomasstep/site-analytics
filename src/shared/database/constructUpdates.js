const {
  OVERALL_PAGE_VIEW_NAME,
  PAGE_VIEW_STAT_NAME,
  STATS_RETENTION_PERIOD,
  TTL_ATTRIBUTE_NAME,
} = require('/opt/config');
const { logger } = require('/opt/logger');

function constructEmptyMapUpdates(stats) {
  const updates = [];
  const attrNames = {};
  const attrValues = {
    ':emptyMap': {},
  };

  Object.entries(stats).forEach(([stat]) => {
    const alphaNumKey = `#${stat.replace(/[^a-z0-9]/gi, '')}`;
    updates.push(`${alphaNumKey} = if_not_exists(${alphaNumKey}, :emptyMap)`);
    attrNames[alphaNumKey] = stat;
  });

  const params = {
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  };

  logger.debug('[constructEmptyMapUpdates] Result', { updates: params });
  return params;
}

function constructStatsUpdates(body) {
  const updates = [];
  const attrNames = {};
  const attrValues = {
    ':zero': 0,
    ':one': 1,
  };

  function addOne(stat, value) {
    const alphaNumKey = `#${stat.replace(/[^a-z0-9]/gi, '')}`;
    const alphaNumValue = `#${value.replace(/[^a-z0-9]/gi, '')}`;
    const attrName = `${alphaNumKey}.${alphaNumValue}`;
    updates.push(`${attrName} = if_not_exists(${attrName}, :zero) + :one`);
    attrNames[alphaNumKey] = stat;
    attrNames[alphaNumValue] = value;
  }

  if (body.pageView) {
    addOne(PAGE_VIEW_STAT_NAME, OVERALL_PAGE_VIEW_NAME);
  }

  Object.entries(body).forEach(([key, value]) => {
    if (value) {
      // Based on payload structure
      // TODO make a model for this for API Gateway
      addOne(key, value);
    }
  });

  const ttl = Math.floor(Date.now() / 1000) + STATS_RETENTION_PERIOD;

  attrNames['#ttl'] = TTL_ATTRIBUTE_NAME;
  attrValues[':ttl'] = ttl;
  const ttlUpdate = '#ttl = if_not_exists(#ttl, :ttl)';
  updates.push(ttlUpdate);

  const params = {
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues,
  };

  logger.debug('[constructStatsUpdates] Result', { updates: params });
  return params;
}

module.exports = {
  constructEmptyMapUpdates,
  constructStatsUpdates,
};
