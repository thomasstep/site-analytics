const { logger } = require('/opt/logger');

function constructAuth(event) {
  try {
    const {
      uniqueId,
    } = event.requestContext.authorizer;

    return {
      uniqueId,
    };
  } catch (err) {
    logger.warn('Error constructing auth.');
    return {};
  }
}

module.exports = {
  constructAuth,
};
