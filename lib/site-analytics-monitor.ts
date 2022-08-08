import * as path from 'path';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Pigeon } from 'cdk-pigeon';

interface IPigeonStackProps extends StackProps {
  authenticationServiceUrl: string,
  authenticationServiceApplicationId: string,
  url: string,
}

export class Monitor extends Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */

  constructor(scope: Construct, id: string, props: IPigeonStackProps) {
    super(scope, id, props);

    const {
      authenticationServiceUrl,
      authenticationServiceApplicationId,
      url,
    } = props;

    new Pigeon(this, 'pigeon', {
      schedule: events.Schedule.rate(Duration.hours(12)),
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(path.join(__dirname, '../syntheticsSrc')),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          'SITE_ANALYTICS_URL': url,
          'AUTHENTICATION_SERVICE_URL': authenticationServiceUrl,
          'AUTH_SERVICE_APP_ID': authenticationServiceApplicationId,
        },
        timeout: Duration.minutes(1),
        logRetention: logs.RetentionDays.ONE_WEEK,
      },
      alertOnFailure: true,
      emailAddress: 'tstep916@gmail.com',
    });
  }
}

