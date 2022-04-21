const {
  constructAuth,
} = require('/opt/authUtils');
const {
  BAD_INPUT_STATUS_CODE,
  CONFLICT_STATUS_CODE,
  FORBIDDEN_STATUS_CODE,
  NOT_FOUND_STATUS_CODE,
  SERVER_ERROR_STATUS_CODE,
  UNAUTHENTICATED_STATUS_CODE,
} = require('/opt/config');
const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { logger } = require('/opt/logger');

/**
 * Higher order function to provide
 * generic error handling for a Lambda function.
 *
 * @param {Function} func Lambda adapter logic with
 *                        signature `async (event, auth)`
 * @returns {Object} Payload to be directly returned from a Lambda
 */
function withErrorHandling(func) {
  return async (event, ...args) => {
    try {
      const auth = constructAuth(event);
      logger.debug('Authentication information', auth);
      const result = await func(event, auth, ...args);
      return result;
    } catch (err) {
      logger.error(err);
      let statusCode = SERVER_ERROR_STATUS_CODE;
      let message = 'Internal server error';

      if (err instanceof MissingEventError) {
        statusCode = NOT_FOUND_STATUS_CODE;
        message = err.message;
      }

      if (err instanceof MissingUniqueIdError) {
        statusCode = UNAUTHENTICATED_STATUS_CODE;
        message = err.message;
      }

      const errorPayload = {
        statusCode,
        body: JSON.stringify({
          message,
        }),
      };

      return errorPayload;
    }
  }
}

module.exports = {
  withErrorHandling,
}