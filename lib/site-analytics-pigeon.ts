import * as path from 'path';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Pigeon } from 'cdk-pigeon';

interface IPigeonStackProps extends StackProps {
  appIdParameter: string,
  appSecretParameter: string,
  url: string,
}

export class PigeonStack extends Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */

  constructor(scope: Construct, id: string, props: IPigeonStackProps) {
    super(scope, id, props);

    const {
      appIdParameter,
      appSecretParameter,
      url,
    } = props;
    const appId = ssm.StringParameter.valueForStringParameter(
      this,
      appIdParameter,
    );
    const appSecret = ssm.StringParameter.valueForStringParameter(
      this,
      appSecretParameter,
    );

    new Pigeon(this, 'pigeon', {
      schedule: events.Schedule.rate(Duration.hours(12)),
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(path.join(__dirname, '../syntheticsSrc')),
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_14_X,
        environment: {
          'SITE_ANALYTICS_URL': url,
          'CROW_AUTH_URL': 'https://api.crowauth.thomasstep.com',
          'CROW_APP_ID': appId,
          'CROW_APP_SECRET': appSecret,
        },
        timeout: Duration.minutes(1),
      },
      alertOnFailure: true,
      emailAddress: 'tstep916@gmail.com',
    });
  }
}

