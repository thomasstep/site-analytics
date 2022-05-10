const {
  readEvent,
  updateEvent,
} = require('/opt/ports');

/**
 *
 * @param {string} calendarId Internal calendar ID (constructed in API model)
 * @param {string} eventId Official event ID
 * @param {Object} eventChanges
 * @param {string} eventChanges.startTime ISO datetime
 * @param {string} eventChanges.endTime ISO datetime
 * @param {string} eventChanges.title Title of the event
 * @returns
 */
async function logic(calendarId, eventId, eventChanges) {
  // Hint: check database logic for DDB-specific event updating validation
  // await updateEvent(calendarId, eventId, eventChanges);
  return;
}

module.exports = {
  logic,
};
