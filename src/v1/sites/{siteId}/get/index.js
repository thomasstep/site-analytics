const { CREATED_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow
  const result = await withErrorHandling(async (event, auth) => {
    const { siteId } = event.pathParameters;

    const siteData = await port(auth, siteId);
    const data = {
      statusCode: CREATED_STATUS_CODE,
      body: JSON.stringify({
        ...siteData,
      }),
    };
    return data;
  })(event);

  return result;
}

module.exports = {
  handler,
};
