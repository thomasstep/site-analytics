#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Tables } from '../lib/site-analytics-tables';
import { Api } from '../lib/site-analytics-api';
import { FrontEnd } from '../lib/site-analytics-front-end';
import { Monitor } from '../lib/site-analytics-monitor';

const app = new cdk.App();
const devTables = new Tables(app, 'site-analytics-tables-dev');
const devApi = new Api(app, 'site-analytics-api-dev', {
  primaryTable: devTables.primaryTable,
  crowApiProps: {
    apiGatewayName: 'site-analytics-dev',
    useAuthorizerLambda: true,
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
    // apiGatewayConfiguration: {
    //   deployOptions: {
    //     tracingEnabled: true,
    //   },
    // },
    // lambdaConfigurations: {
    //   '/v1/sites/post': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    //   '/v1/sites/get': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    //   '/v1/sites/{siteId}/get': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    //   '/v1/sites/{siteId}/delete': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    //   'v1/sites/{siteId}/stats/get': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    //   '/v1/sites/{siteId}/stats/post': {
    //     tracing: lambda.Tracing.ACTIVE,
    //   },
    // }
  },
});
new FrontEnd(app, 'site-analytics-front-end-dev', {});
new Monitor(app, 'site-analytics-monitor-dev', {
  appIdParameter: '/site-analytics-api-dev/crow-app-id',
  appSecretParameter: '/site-analytics-api-dev/crow-app-secret',
  url: devApi.api.gateway.url,
});
