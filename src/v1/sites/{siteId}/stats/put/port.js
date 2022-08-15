const {
  TOTAL_PAGE_VIEWS_ATTRIBUTE_NAME,
} = require('/opt/config');

const {
  InputError,
} = require('/opt/errors');

const { logic } = require('./logic');

async function port(siteId, stats) {
  if (stats[TOTAL_PAGE_VIEWS_ATTRIBUTE_NAME]) {
    throw new InputError(`Not allowed to create or update statistic with name ${TOTAL_PAGE_VIEWS_ATTRIBUTE_NAME}`);
  }

  await logic(siteId, stats);
}

module.exports = {
  port,
};
