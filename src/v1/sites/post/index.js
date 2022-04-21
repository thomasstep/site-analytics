const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

exports.handler = async function (event, context, callback) {
  const result = await withErrorHandling(async (event, auth) => {
    const body = JSON.parse(event.body);

    const xxxxxx = await port(auth, body);
    const data = {
      statusCode: CREATED_STATUS_CODE,
      body: JSON.stringify({
        id: xxxxxx,
      }),
    };
    return data;
  })(event);

  return result;
}