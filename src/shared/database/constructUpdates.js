const {
  OVERALL_PAGE_VIEW_ATTRIBUTE_NAME,
  STATS_RETENTION_PERIOD,
  TTL_ATTRIBUTE_NAME,
} = require('/opt/config');
const { logger } = require('/opt/logger');

function constructStatsUpdates(body) {
  const updates = [];
  const attrNames = {};
  const attrValues = {
    ':zero': 0,
    ':one': 1,
  };

  if (body.pageView) {
    const pageView = 'pageView';
    const alphaNumKey = `#${pageView.replace(/[^a-z0-9]/gi, '')}`;
    const alphaNumValue = `#${OVERALL_PAGE_VIEW_ATTRIBUTE_NAME.replace(/[^a-z0-9]/gi, '')}`;
    const attrName = `${alphaNumKey}.${alphaNumValue}`;
    updates.push(`${attrName} = if_not_exists(${attrName}, :zero) + :one`);
    attrNames[alphaNumKey] = pageView;
    attrNames[alphaNumValue] = OVERALL_PAGE_VIEW_ATTRIBUTE_NAME;
  }

  Object.entries(body).forEach(([key, value]) => {
    if (value) {
      // Based on payload structure
      // TODO make a model for this for API Gateway
      const alphaNumKey = `#${key.replace(/[^a-z0-9]/gi, '')}`;
      const alphaNumValue = `#${value.replace(/[^a-z0-9]/gi, '')}`;
      const attrName = `${alphaNumKey}.${alphaNumValue}`;
      updates.push(`${attrName} = if_not_exists(${attrName}, :zero) + :one`);
      attrNames[alphaNumKey] = key;
      attrNames[alphaNumValue] = value;
    }
  });

  const ttl = Math.floor(Date.now() / 1000) + STATS_RETENTION_PERIOD;

  attrNames['#ttl'] = TTL_ATTRIBUTE_NAME;
  attrValues[':ttl'] = ttl;
  const ttlUpdate = `#ttl = if_not_exists(#ttl, :ttl)`;
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
  constructStatsUpdates,
};
