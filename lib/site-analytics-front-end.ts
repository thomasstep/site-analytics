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

/**
 * templateDirectory is the top level directory where all the templates are stored
 * currentChildDirectory is the current path underneath the templateDirectory that we are processing
 * htmlDirectory is where processed HTML templates should be written
 */
function processHtmlTemplates(templateDirectory: string, currentChildDirectory: string, htmlDirectory: string) {
    const currentDirectory = `${templateDirectory}${currentChildDirectory}`;
    const directoryEntries = fse.readdirSync(currentDirectory, { withFileTypes: true });
    const files = directoryEntries
      .filter((dirent: any) => dirent.isFile())
      .map((dirent: any) => dirent.name);
    const directories = directoryEntries
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
    files.forEach((file) => {
      const templatePath = `${currentDirectory}/${file}`;
      const htmlChildDirectory = `${htmlDirectory}${currentChildDirectory}`;
      const htmlPath = `${htmlChildDirectory}/${file}`;
      const template = fse.readFileSync(templatePath, 'utf8');
      const staticPage = mustache.render(template, templateValues);
      fse.mkdirSync(htmlChildDirectory, { recursive: true });
      fse.writeFileSync(htmlPath, staticPage);
    });
    directories.forEach((directory) => {
      // Recursion stops when the file tree ends
      processHtmlTemplates(templateDirectory, `${currentChildDirectory}/${directory}`, htmlDirectory);
    });
}

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
      websiteIndexDocument: 'index',
      websiteErrorDocument: '404',
    });

    // Preprocess with mustache.js
    const templateDirectory = 'siteTemplates';
    const htmlDirectory = 'site';
    processHtmlTemplates(templateDirectory, '', htmlDirectory);

    const deployment = new s3Deploy.BucketDeployment(this, 'site-analytics-site-deployment', {
      sources: [s3Deploy.Source.asset(htmlDirectory)],
      destinationBucket: primaryBucket,
      contentType: 'text/html',
      prune: true,
    });

    const primaryBucketDistribution = new cloudfront.Distribution(this, 'site-analytics-site-dist', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(primaryBucket),
      },
    });
  }
}
