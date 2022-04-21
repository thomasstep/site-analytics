const {
  MissingUniqueIdError,
} = require('/opt/errors');
const { logger } = require('/opt/logger');

function constructAuth(event) {
  let {
    apiKey,
    userUniqueId,
  } = event?.requestContext?.authorizer;

  return {
    apiKey,
    userUniqueId,
  };
}

function constructCalendarId(auth, calendarId) {
  const {
    uniqueId,
  } = auth;
  if (!uniqueId) {
    throw new MissingUniqueIdError('Unique ID not found while constructing calendar ID', auth, calendarId);
  }
  return `${uniqueId}${CALENDAR_ID_SEPARATOR}${calendarId}`;
}

function deconstructCalendarId(officialCalendarId) {
  const [uniqueId, externalCalendarId] = officialCalendarId.split(CALENDAR_ID_SEPARATOR);
  return [uniqueId, externalCalendarId];
}

module.exports = {
  constructAuth,
  constructCalendarId,
  deconstructCalendarId,
};