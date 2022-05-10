#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TablesStack } from '../lib/site-analytics-tables-stack';
import { SiteAnalyticsStack } from '../lib/site-analytics-stack';

const app = new cdk.App();
const devTables = new TablesStack(app, 'site-analytics-tables-dev');
new SiteAnalyticsStack(app, 'site-analytics-api-dev', {
  primaryTable: devTables.primaryTable,
  crowApiProps: {
    apiGatewayName: 'site-analytics-dev',
  }
});
