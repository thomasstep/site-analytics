#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Tables } from '../lib/site-analytics-tables';
import { Bucket } from '../lib/site-analytics-buckets';
import { Api } from '../lib/site-analytics-api';
import { FrontEnd } from '../lib/site-analytics-front-end';
import { Monitor } from '../lib/site-analytics-monitor';

const app = new cdk.App();
const devTables = new Tables(app, 'site-analytics-tables-dev');
const devBuckets = new Bucket(app, 'site-analytics-buckets-dev', {});
const devApi = new Api(app, 'site-analytics-api-dev', {
  primaryTable: devTables.primaryTable,
  primaryBucket: devBuckets.primaryBucket,
  crowApiProps: {
    apiGatewayName: 'site-analytics-dev',
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
          title: '/v1/sites/{siteId}/stats/post',
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
new FrontEnd(app, 'site-analytics-front-end-dev', {});
new Monitor(app, 'site-analytics-monitor-dev', {
  authenticationServiceUrl: 'https://kelxh6t44h.execute-api.us-east-1.amazonaws.com/prod',
  authenticationServiceApplicationId: 'ebcf1967-94d6-4fe1-9f28-323614e4e1a1',
  url: devApi.api.gateway.url,
});
