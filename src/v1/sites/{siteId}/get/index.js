const { CREATED_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

exports.handler = async function (event, context, callback) {
  const result = await withErrorHandling(async (event, auth) => {
    const siteId = event.pathParameters.siteId;

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