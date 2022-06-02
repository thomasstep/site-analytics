const { logger } = require('/opt/logger');

function getDateFromISOString(isoString) {
  const [date] = isoString.split('T');
  return date;
}

function getDateRange(startTs, endTs) {
  logger.debug('Start getDateRange', {
    startTimestamp: startTs,
    endTimestamp: endTs,
  });
  const startDate = new Date(startTs.getUTCFullYear(), startTs.getUTCMonth(), startTs.getUTCDate());
  const endDate = new Date(endTs.getUTCFullYear(), endTs.getUTCMonth(), endTs.getUTCDate());

  const oneDayInMs = (1000 * 60 * 60 * 24);
  const daysBetween = ((endDate - startDate) / oneDayInMs);
  logger.debug('getDateRange', {
    daysBetween,
  });

  const dates = [getDateFromISOString(startDate.toISOString())];

  for (let i = 1; i < daysBetween + 1; i += 1) {
    startDate.setDate(startDate.getDate() + 1);
    dates.push(getDateFromISOString(startDate.toISOString()));
  }

  logger.debug('Completed getDateRange', {
    dates,
  });
  return dates;
}

module.exports = {
  getDateFromISOString,
  getDateRange,
};
