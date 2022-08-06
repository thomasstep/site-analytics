import * as fs from 'fs';
import * as path from 'path';

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
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
  primaryBucket: s3.Bucket,
  crowApiProps: CrowApiProps,
}

export class Api extends Stack {
  public api!: CrowApi;
  constructor(scope: Construct, id: string, props: ISiteAnalyticsStackProps) {
    super(scope, id, props);

    const {
      primaryTable,
      primaryBucket,
      crowApiProps,
    } = props;

    const snsTopic = new sns.Topic(this, 'topic');
    let sqsQueue: sqs.Queue | undefined;
    if (config.useSqs) {
      sqsQueue = new sqs.Queue(this, 'queue');
    }

    let authorizationConfig = {};
    if (config.useAuthorization) {
      authorizationConfig = {
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        useAuthorizerLambda: true,
      };
    }
    const finalCrowApiProps = {
      ...crowApiProps,
      methodConfigurations: {
        '/v1/sites/post': {
          ...authorizationConfig,
          requestModels: {
            'application/json': 'createSite',
          },
          requestValidator: 'validateBody',
        },
        '/v1/sites/get': {
          ...authorizationConfig,
        },
        '/v1/sites/{siteId}/get': {
          ...authorizationConfig,
        },
        '/v1/sites/{siteId}/delete': {
          ...authorizationConfig,
        },
        '/v1/sites/{siteId}/stats/get': {
          ...authorizationConfig,
          requestParameters: {
            'method.request.querystring.startDate': false,
            'method.request.querystring.endDate': false,
          },
          requestValidator: 'validateParams',
        },
        // Defined below
        // '/v1/sites/{siteId}/stats/post': {
        //   requestModels: {
        //     'application/json': 'createStats',
        //   },
        //   requestValidator: 'validateBody',
        // },
      },
    };

    const api = new CrowApi(this, 'api', {
      ...finalCrowApiProps,
    });
    this.api = api;

    connectDdbToLambdas(
      primaryTable,
      api.lambdaFunctions,
      [
        '/v1/sites/post',
        '/v1/sites/get',
        '/v1/sites/{siteId}/get',
        '/v1/sites/{siteId}/delete',
        '/v1/sites/{siteId}/stats/get',
        // '/v1/sites/{siteId}/stats/post',
      ],
      'PRIMARY_TABLE_NAME',
    );


    primaryTable.grantFullAccess(api.authorizerLambda);
    api.authorizerLambda.addEnvironment('PRIMARY_TABLE_NAME', primaryTable.tableName);

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

    const scriptResource = v1Resource.getResource('script.js');
    if (!scriptResource) {
       throw new Error('script resource cannot be found');
    }

    const sitesResource = v1Resource.getResource('sites');
     if (!sitesResource) {
       throw new Error('sites resource cannot be found');
     }

    const sitesIdResource = sitesResource.getResource('{siteId}');
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

    const s3ApiGatewayRole = new iam.Role(this, 's3-integration-role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });
    primaryBucket.grantRead(s3ApiGatewayRole);

    const defaultMethodOptions = {
      methodResponses: [
        {
          statusCode: "202",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': config.corsAllowOriginHeader,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
        {
          statusCode: "500",
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': config.corsAllowOriginHeader,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
      ],
    };

    /**************************************************************************
     *
     * GET script to add stats
     *
     *************************************************************************/

     scriptResource.addMethod(
      'GET',
      new apigateway.AwsIntegration({
        service: 's3',
        path: '{bucket}/script.js',
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: s3ApiGatewayRole,
          passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
            'integration.request.path.bucket': `'${primaryBucket.bucketName}'`
          },
          integrationResponses: [
            {
              statusCode: "200",
            },
            {
              statusCode: "404",
              selectionPattern: "404",
              responseTemplates: {
                'application/json': '{"error": "Stats script not available."}',
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
      {
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': config.corsAllowOriginHeader,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: "404",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': config.corsAllowOriginHeader,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
          {
            statusCode: "500",
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': config.corsAllowOriginHeader,
              'method.response.header.Access-Control-Allow-Credentials': true,
            },
          },
        ],
      },
    );

    /**************************************************************************
     *
     * POST stats
     *
     *************************************************************************/


    let postStatsMessage = `$util.urlEncode('{"siteId":"')$util.escapeJavaScript($input.params('siteId'))`;
    postStatsMessage += `$util.urlEncode('","body":')$input.json('$')`;
    postStatsMessage += `$util.urlEncode('}')`;
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
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
          },
          requestTemplates: {
            'application/json': `Action=Publish&TopicArn=$util.urlEncode(\'${snsTopic.topicArn}\')\
&Message=${postStatsMessage}\
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
      {
        ...defaultMethodOptions,
        requestModels: {
          'application/json': api.models.createStats,
        },
        requestValidator: api.requestValidators.validateBody,
      },
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
