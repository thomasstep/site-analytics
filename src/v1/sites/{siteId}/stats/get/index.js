const { CREATED_STATUS_CODE } = require('/opt/config');
const {
  withErrorHandling,
} = require('/opt/lambdaAdapterUtils');

const { port } = require('./port');

async function handler(event) {
  // eslint-disable-next-line no-shadow
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

module.exports = {
  handler,
};
