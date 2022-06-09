import * as path from 'path';

import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';

import * as fse from 'fs-extra';
import * as mustache from 'mustache';

const filePath = path.join(process.cwd(), 'config.json');
const contents = fse.readFileSync(filePath, 'utf8');
const config = JSON.parse(contents);
const { templateValues } = config;

export class FrontEnd extends Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // const allowedOrigins = deploymentStage === 'prod' ?
    //   ['https://papyrusmenus.com', 'https://www.papyrusmenus.com', 'https://papyrus.thomasstep.com']
    //   : ['*'];

    const primaryBucket = new s3.Bucket(this, 'site-analytics-site-bucket', {
      publicReadAccess: true,
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
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
    // TODO turn this into a recursive function whenever the directory has deeper paths
    const templateDirectory = 'siteTemplates';
    const htmlDirectory = 'site';
    const files = fse.readdirSync(templateDirectory, { withFileTypes: true })
      .filter((dirent: any) => dirent.isFile())
      .map((dirent: any) => dirent.name);
    console.log(files)
    files.forEach((file) => {
      // File should be a .html; otherwise, it's a directory
      const templatePath = `${templateDirectory}/${file}`;
      const htmlPath = `${htmlDirectory}/${file}`;
      const template = fse.readFileSync(templatePath, 'utf8');
      console.log(templateValues);
      const staticPage = mustache.render(template, templateValues);
      fse.writeFileSync(htmlPath, staticPage);
    });

    const deployment = new s3Deploy.BucketDeployment(this, 'site-analytics-site-deployment', {
      sources: [s3Deploy.Source.asset(htmlDirectory)],
      destinationBucket: primaryBucket,
    });

    const primaryBucketDistribution = new cloudfront.Distribution(this, 'site-analytics-site-dist', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(primaryBucket),
      },
    });
  }
}
