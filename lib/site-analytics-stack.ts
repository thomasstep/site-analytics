const fs = require('fs');
const path = require('path');

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSub from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { CrowApi, CrowApiProps, LambdasByPath } from 'crow-api';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fs.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);

function connectDdbToLambdas(table: dynamodb.Table, apiLambdas: LambdasByPath, paths: string[], envVarName: string) {
  paths.forEach((lambdaPath) => {
    const lambda = apiLambdas[lambdaPath];
    table.grantFullAccess(lambda);
    lambda.addEnvironment(envVarName, table.tableName);
  })
}

interface ISiteAnalyticsStackProps extends StackProps {
  primaryTable: dynamodb.Table,
  crowApiProps: CrowApiProps,
}

export class SiteAnalyticsStack extends Stack {
  constructor(scope: Construct, id: string, props: ISiteAnalyticsStackProps) {
    super(scope, id, props);

    const {
      primaryTable,
      crowApiProps,
    } = props;

    const snsTopic = new sns.Topic(this, 'topic');
    let sqsQueue: sqs.Queue | undefined;
    if (config.useSqs) {
      sqsQueue = new sqs.Queue(this, 'queue');
    }

    const finalCrowApiProps = {
      ...crowApiProps,
      methodConfigurations: {
        '/v1/calendars/{calendarId}/delete': {
          apiKeyRequired: true,
          authorizationType: apigateway.AuthorizationType.CUSTOM,
        },
        '/v1/calendars/post': {
          apiKeyRequired: true,
          authorizationType: apigateway.AuthorizationType.CUSTOM,
        },
        '/v1/calendars/{calendarId}/events/post': {
          requestModels: {
            'application/json': 'eventsPost',
          },
          requestValidator: 'validateBody',
          apiKeyRequired: true,
          authorizationType: apigateway.AuthorizationType.CUSTOM,
        },
        '/v1/calendars/{calendarId}/events/get': {
          requestParameters: {
            'method.request.querystring.startTime': true,
            'method.request.querystring.endTime': true,
          },
          requestValidator: 'validateParams',
          apiKeyRequired: true,
          authorizationType: apigateway.AuthorizationType.CUSTOM,
        },
      },
    };

    const api = new CrowApi(this, 'api', {
      ...finalCrowApiProps,
    });

    connectDdbToLambdas(
      primaryTable,
      api.lambdaFunctions,
      [
        '/v1/sites/post',
        '/v1/sites/get',
        '/v1/sites/{id}/get',
        // '/v1/sites/{id}/stats/post',
      ],
      'PRIMARY_TABLE_NAME',
    );

    /**************************************************************************
     *
     * Create async Lambdas in this stack. They use the shared layer
     * and I do not want to introduce that cross-stack dependency because
     * then I can not update the layer
     *
     *************************************************************************/

    /**************************************************************************
     *
     * Setup common resources
     *
     *************************************************************************/

    const v1Resource = api.gateway.root.getResource('v1');
     if (!v1Resource) {
       throw new Error('v1 resource cannot be found');
     }

    const sitesResource = v1Resource.getResource('sites');
     if (!sitesResource) {
       throw new Error('sites resource cannot be found');
     }

    const sitesIdResource = sitesResource.getResource('{id}');
     if (!sitesIdResource) {
       throw new Error('sites by ID resource cannot be found');
     }

    const statsResource = sitesIdResource.getResource('stats');
     if (!statsResource) {
       throw new Error('stats resource cannot be found');
     }

    const apiGatewayRole = new iam.Role(this, 'integration-role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });
    snsTopic.grantPublish(apiGatewayRole);

    const defaultMethodOptions = {
      methodResponses: [
        {
          statusCode: "202",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: "500",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    };

    /**************************************************************************
     *
     * POST stats
     *
     *************************************************************************/

    statsResource.addMethod(
      'POST',
      new apigateway.AwsIntegration({
        service: 'sns',
        path: '/',
        integrationHttpMethod: 'POST',
        options: {
          credentialsRole: apiGatewayRole,
          passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
          requestParameters: {
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
          },
          requestTemplates: {
            'application/json': `Action=Publish&TopicArn=$util.urlEncode(\'${snsTopic.topicArn}\')\
&Message=$input.body\
&MessageAttributes.entry.1.Name=operation\
&MessageAttributes.entry.1.Value.DataType=String\
&MessageAttributes.entry.1.Value.StringValue=postStats`,
          },
          integrationResponses: [
            {
              statusCode: "202",
              responseTemplates: {
                'application/json': '{}',
              },
            },
            {
              statusCode: "500",
              // Anything but a 2XX response
              selectionPattern: "(1|3|4|5)\\d{2}",
              responseTemplates: {
                'application/json': '{}',
              },
            },
          ],
        },
      }),
      defaultMethodOptions,
    );

    let layers: lambda.ILayerVersion[] | undefined;
    if (api.lambdaLayer) {
      layers = [api.lambdaLayer];
    }

    const dlq = new sqs.Queue(this, `post-stats-dlq`, {});
    const postStats = new lambda.Function(
      this,
      `post-stats-lambda`,
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.Code.fromAsset(`asyncSrc/postStats`),
        handler: 'index.handler',
        logRetention: logs.RetentionDays.ONE_WEEK,
        deadLetterQueue: dlq,
        layers,
      },
    );
    primaryTable.grantFullAccess(postStats);
    postStats.addEnvironment('PRIMARY_TABLE_NAME', primaryTable.tableName);
    if (config.useSqs && sqsQueue) {
      // TODO Does the SQS Queue need its own DLQ?
      // TODO Test that this integration works
      snsTopic.addSubscription(new snsSub.SqsSubscription(
        sqsQueue,
        {
          filterPolicy: {
            operation: sns.SubscriptionFilter.stringFilter({
              allowlist: ['postStats'],
            }),
          },
        }
      ));
      postStats.addEventSource(new lambdaEventSources.SqsEventSource(sqsQueue));
    } else {
      snsTopic.addSubscription(new snsSub.LambdaSubscription(
        postStats,
        {
          filterPolicy: {
            operation: sns.SubscriptionFilter.stringFilter({
              allowlist: ['postStats'],
            }),
          },
        }
      ));
    }
  }
}
