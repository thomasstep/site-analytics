const { GOOD_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow
  const result = await withErrorHandling(async (event, auth) => {
    const { siteId } = event.pathParameters;
    // These are not required query string parameters as defined
    //   in the API Gateway models for this endpoint
    // Validation happens in the port
    const startDate = event?.queryStringParameters?.startDate;
    const endDate = event?.queryStringParameters?.endDate;

    const statsByDate = await port(auth, siteId, startDate, endDate);
    const data = {
      statusCode: GOOD_STATUS_CODE,
      body: JSON.stringify(statsByDate),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
