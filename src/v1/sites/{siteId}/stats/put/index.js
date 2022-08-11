const { GOOD_NO_OUTPUT_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow
  const result = await withErrorHandling(async (event, auth) => {
    const { siteId } = event.pathParameters;
    const stats = JSON.parse(event.body);

    await port(siteId, stats);
    const data = {
      statusCode: GOOD_NO_OUTPUT_STATUS_CODE,
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
