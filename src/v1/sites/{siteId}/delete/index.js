const { GOOD_NO_OUTPUT_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

exports.handler = async function (event, context, callback) {
  const result = await withErrorHandling(async (event, auth) => {
    const siteId = event.pathParameters.siteId;

    await port(auth, siteId);
    const data = {
      statusCode: GOOD_NO_OUTPUT_STATUS_CODE,
    };
    return data;
  })(event);

  return result;
}