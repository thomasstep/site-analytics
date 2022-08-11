import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';

import { processTemplates } from './util';

interface ISiteAnalyticsFrontEndStackProps extends StackProps {
  allowedOrigins: string[],
}

export class FrontEnd extends Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope: Construct, id: string, props: ISiteAnalyticsFrontEndStackProps) {
    super(scope, id, props);

    const {
      allowedOrigins,
    } = props;

    const primaryBucket = new s3.Bucket(this, 'site-analytics-site-bucket', {
      publicReadAccess: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins,
          allowedHeaders: ['*'],
        },
      ],
      lifecycleRules: [
        {
          enabled: true,
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
      // This enabled web hosting
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
    });

    // Preprocess with mustache.js
    const templateDirectory = 'siteTemplates';
    const siteDirectory = 'site';
    processTemplates(templateDirectory, '', siteDirectory);

    new s3Deploy.BucketDeployment(this, 'site-analytics-site-deployment', {
      sources: [
        s3Deploy.Source.asset(siteDirectory),
      ],
      destinationBucket: primaryBucket,
      prune: true,
    });

    new cloudfront.Distribution(this, 'site-analytics-site-dist', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(primaryBucket),
      },
    });
  }
}
