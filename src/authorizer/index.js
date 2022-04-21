const { jwtVerify } = require('jose/jwt/verify');
const { createUser } = require('../shared/ports');

const config = require('/opt/config');
const {
  readUser,
} = require('/opt/ports');

// Helper function to generate an IAM policy
var generatePolicy = function(principalId, apiStageArn, userUniqueId /* userData */) {
    const authResponse = {};

    authResponse.principalId = principalId;
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: `${apiStageArn}/*`,
        },
      ],
    };

    authResponse.policyDocument = policyDocument;
    authResponse.context = {
      userUniqueId,
    };
    // authResponse.context = userData;

    return authResponse;
}

exports.handler = async function(event, context, callback) {
  const authorizationHeader = event.authorizationToken;
  const [type, token] = authorizationHeader.split(' ');

  const methodArn = event.methodArn;
  const [apiGatewayArn, stage] = methodArn.split('/');
  const apiStageArn = `${apiGatewayArn}/${stage}`;

  try {
    const {
      jwksUrl,
      jwtUserIdKey,
      jwtClaims,
    } = config;
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const { payload, protectedHeader } = await jwtVerify(token, JWKS, jwtClaims);
    const userId = payload[jwtUserIdKey];

    const userData = await readUser(userId);
    if (!userData) {
      await createUser(userId);
      throw new Error('User does not exist');
    }

    const policy = generatePolicy(applicationId, apiStageArn, userId);
    return policy;
  } catch (err) {
    console.error('Bad things happened while decoding JWT');
    console.error(err);
  }

  throw new Error('Unauthorized');
};
