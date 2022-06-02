const { logic } = require('./logic');

async function port(auth, siteId, startDate, endDate) {
  // TODO if neither start nor end date, make both current day
  // TODO if start date but not end date, make end date current day
  // TODO if end date but not start date, throw error
  // TODO make sure that start date is before end date
  const statsByDate = await logic(auth, siteId, startDate, endDate);
  return statsByDate;
}

module.exports = {
  port,
};
