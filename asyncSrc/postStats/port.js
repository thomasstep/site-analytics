const { logic } = require('./logic');

async function port(calendarId, eventId, payload) {
  // Validate
  try {
    new Date(payload.startTime);
    new Date(payload.endTime);
  } catch (err) {
    throw new InputError('startTime and endTime must be ISO 8601 timestamps e.g. 1995-12-13T03:24:00Z.');
  }

  // Construct event based on contract
  const eventChanges = {
    title: payload.title,
    startTime: payload.startTime,
    endTime: payload.endTime,
  };

  await logic(calendarId, eventId, eventChanges);
  return;
}

module.exports = {
  port,
};