const {
  TOTAL_PAGE_VIEWS_ATTRIBUTE_NAME,
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
    let cleanValue = value.replace(/[^a-z0-9]/gi, '');
    if (cleanValue === '') {
      // If there is ever a page with this name, then there will be weird errors
      cleanValue = 'defaultValueForCaseOfSingleSlash12340987';
    }

    const alphaNumKey = `#${stat.replace(/[^a-z0-9]/gi, '')}`;
    const alphaNumValue = `#${cleanValue}`;
    const attrName = `${alphaNumKey}.${alphaNumValue}`;
    updates.push(`${attrName} = if_not_exists(${attrName}, :zero) + :one`);
    attrNames[alphaNumKey] = stat;
    attrNames[alphaNumValue] = value;
  }

  Object.entries(body).forEach(([key, value]) => {
    if (value) {
      // Based on payload structure
      addOne(key, value);
    }
  });

  if (body[PAGE_VIEW_STAT_NAME]) {
    attrNames['#totalPageViews'] = TOTAL_PAGE_VIEWS_ATTRIBUTE_NAME;
    const totalPageViewsUpdate = '#totalPageViews = if_not_exists(#totalPageViews, :zero) + :one';
    updates.push(totalPageViewsUpdate);
  }

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
