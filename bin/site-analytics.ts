#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { TablesStack } from '../lib/site-analytics-tables-stack';
import { SiteAnalyticsStack } from '../lib/site-analytics-stack';
import { PigeonStack } from '../lib/site-analytics-pigeon';

const app = new cdk.App();
const devTables = new TablesStack(app, 'site-analytics-tables-dev');
const devApi = new SiteAnalyticsStack(app, 'site-analytics-api-dev', {
  primaryTable: devTables.primaryTable,
  crowApiProps: {
    apiGatewayName: 'site-analytics-dev',
    useAuthorizerLambda: true,
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
  }
});
new PigeonStack(app, 'site-analytics-pigeon-dev', {
  appIdParameter: '/site-analytics-api-dev/crow-app-id',
  appSecretParameter: '/site-analytics-api-dev/crow-app-secret',
  url: devApi.api.gateway.url,
});
