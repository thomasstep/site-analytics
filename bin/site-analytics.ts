#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Tables } from '../lib/site-analytics-tables';
import { Bucket } from '../lib/site-analytics-buckets';
import { Api } from '../lib/site-analytics-api';
import { FrontEnd } from '../lib/site-analytics-front-end';
import { Monitor } from '../lib/site-analytics-monitor';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

const app = new cdk.App();

const tables = new Tables(app, 'site-analytics-tables');
const buckets = new Bucket(app, 'site-analytics-buckets', {});
const api = new Api(app, 'site-analytics-api', {
  primaryTable: tables.primaryTable,
  primaryBucket: buckets.primaryBucket,
  crowApiProps: {
    apiGatewayName: 'site-analytics',
    useAuthorizerLambda: true,
    apiGatewayConfiguration: {
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowCredentials: true,
      },
    },
    lambdaIntegrationOptions: {
      '/v1/sites/{siteId}/stats/get': {
        requestParameters: {
          'integration.request.querystring.startDate': 'method.request.querystring.startDate',
          'integration.request.querystring.endDate': 'method.request.querystring.endDate',
        },
      },
    },
    models: [
      {
        modelName: 'createSite',
        schema: {
          schema: apigateway.JsonSchemaVersion.DRAFT4,
          title: 'createSite',
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['url'],
          properties: {
            url: {
              type: apigateway.JsonSchemaType.STRING,
              format: 'hostname',
            },
            name: {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          additionalProperties: false,
        },
      },
      {
        modelName: 'createStats',
        schema: {
          schema: apigateway.JsonSchemaVersion.DRAFT4,
          title: '/v1/sites/{siteId}/stats/put',
          type: apigateway.JsonSchemaType.OBJECT,
          // Body must be map[string]string
          patternProperties: {
            "^[a-zA-Z]+$": {
              type: apigateway.JsonSchemaType.STRING,
            },
          },
          // Any stats wanting to be collected can be
          additionalProperties: false,
        },
      },
    ],
    requestValidators: [
      {
        requestValidatorName: 'validateBody',
        validateRequestBody: true,
      },
      {
        requestValidatorName: 'validateParams',
        validateRequestParameters: true,
      },
    ],
  },
});
new Monitor(app, 'site-analytics-monitor', {
  authenticationServiceUrl: config.authenticationServiceUrl,
  authenticationServiceApplicationId: config.authenticationServiceApplicationId,
  url: api.api.gateway.url,
});
if (!config.headless) {
  new FrontEnd(app, 'site-analytics-front-end', {
    allowedOrigins: config.frontEndAllowedOrigins,
    domainNames: config.frontEndDomainNames,
    certificateArn: config.frontEndCertificateArn,
    authServiceUrl: config.authenticationServiceUrl,
    applicationId: config.authenticationServiceApplicationId,
    analyticsServiceUrl: config.frontEndAnalyticsServiceUrl,
    debug: 'false',
  });
}
