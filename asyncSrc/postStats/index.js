const { logger } = require('/opt/logger');

const { port } = require('./port');

async function handler(event, context, callback) {
  try {
    const recordPromises = [];
    event.Records.forEach((record) => {
      const {
        Sns: {
          Message: stringifiedMessage,
        },
      } = record;
      // API Gateway is set up to send JSON of required path params
      const message = JSON.parse(stringifiedMessage);
      logger.info(message);
      const {
        calendarId,
        eventId,
        body: eventChanges,
      } = message;
      recordPromises.push(port(
        calendarId,
        eventId,
        eventChanges,
      ));
    });

    await Promise.all(recordPromises);

    return;
  } catch (uncaughtError) {
    logger.error(uncaughtError);
    throw uncaughtError;
  }
}

module.exports = {
  handler,
};
