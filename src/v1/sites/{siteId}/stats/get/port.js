const {
  InputError,
} = require('/opt/errors');

const { logic } = require('./logic');

async function port(auth, siteId, startDateInput, endDateInput) {
  let startDate = startDateInput;
  let endDate = endDateInput;
  const [currentDay] = new Date().toISOString().split('T');

  // If neither start nor end date, make both current day
  if (!startDate && !endDate) {
    startDate = currentDay;
    endDate = currentDay;
  }

  // If start date but not end date, make end date current day
  if (startDate && !endDate) {
    endDate = currentDay;
  }

  // If end date but not start date, throw error
  if (!startDate && endDate) {
    throw new InputError('End date is required when start date is given.', auth);
  }

  // Make sure that start date is before end date
  const startDateObject = new Date(startDate);
  const endDateObject = new Date(endDate);
  if (endDateObject < startDateObject) {
    throw new InputError('End date needs to be after start date.', auth);
  }

  const statsByDate = await logic(auth, siteId, startDate, endDate);
  return statsByDate;
}

module.exports = {
  port,
};
