import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class Tables extends Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */

  public primaryTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const primaryTable = new dynamodb.Table(this, 'primary-table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'secondaryId',
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: 'ttl',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      replicationRegions: [],
    });
    this.primaryTable = primaryTable;
  }
}

