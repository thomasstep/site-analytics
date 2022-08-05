const fs = require('fs');

const contents = fs.readFileSync('/opt/config.json', 'utf8');
const config = JSON.parse(contents);

const CONSTANTS = {
  // DynamoDB
  DEFAULT_DYNAMODB_REGION: 'us-east-1',
  PRIMARY_TABLE_NAME: process.env.PRIMARY_TABLE_NAME,
  USER_SORT_KEY: 'profile',
  SITE_SORT_KEY: 'site',
  STATS_SORT_KEY: 'stats',
  STATS_RETENTION_PERIOD: 2592000, // 30 days in seconds
  OVERALL_PAGE_VIEW_NAME: 'overall',
  PAGE_VIEW_STAT_NAME: 'pageView',
  TTL_ATTRIBUTE_NAME: 'ttl',
  // Status codes
  GOOD_STATUS_CODE: 200,
  CREATED_STATUS_CODE: 201,
  GOOD_NO_OUTPUT_STATUS_CODE: 204,
  BAD_INPUT_STATUS_CODE: 400,
  UNAUTHENTICATED_STATUS_CODE: 401,
  UNAUTHORIZED_STATUS_CODE: 401,
  FORBIDDEN_STATUS_CODE: 403,
  NOT_FOUND_STATUS_CODE: 404,
  CONFLICT_STATUS_CODE: 409,
  SERVER_ERROR_STATUS_CODE: 500,
  // Misc
  corsAllowOriginHeader: '*', // Can be overridden
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
};

/**
 * Convention is constants are upper case and config is lower case keys
 */

module.exports = {
  ...config,
  ...CONSTANTS,
};
