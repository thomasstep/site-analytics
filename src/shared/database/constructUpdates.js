const {
  STATS_RETENTION_PERIOD,
} = require('/opt/config');
const { logger } = require('/opt/logger');

function constructStatsUpdates(body) {
  const updates = [];
  const attrNames = {};
  const attrValues = {};

  Object.entries(body).forEach(([key, value]) => {
    if (value) {
      // Based on payload structure
      // TODO make a model for this for API Gateway
      updates.push(`#${key} = :${key} + 1`);
      attrNames[`#${key}`] = key;
      attrValues[`:${key}`] = value;
    }
  });

  const ttl = Math.floor(Date.now() / 1000) + STATS_RETENTION_PERIOD;
  const ttlUpdate = `SET ttl = if_not_exists(ttl, ${ttl})`;
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
