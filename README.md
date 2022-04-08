# Site Analytics

## Design

### Authentication

Authentication is JWT based. A proper JWKS URL and claims will need to be configured for the Lambda authorizer to know how to validate JWTs. The JWKS URL and claims will be part of the configuration file that is read in and given to the Lambda authorizer. The Lambda authorizer source will be held in `src/authorizer`.

Authentication can be completely disabled if desired although that is not recommended.

### Authorization

- Be part of the data model.
- Look into having "teams" where users can be assigned to the team and each resource that is owned by a team can be accessed by its users without having to individually grant access to users

### Data Layer

- DynamoDB
- Maybe S3
- Maybe some sort of cache down the line

#### Data Model

- Do this later

### API Layer

- API Gateway and Lambda/service proxy integrations (SNS and/or SQS for async calls)
  - Level of async absorption to be configuration item
    - Lowest: direct to DDB (is this possible; depends on if it needs transformation)
    - Middle: SNS -> Lambda -> DDB
    - Highest: SNS -> SQS -> Lambda -> DDB
- The Lambda that handles site count will have to be very fast or else the whole system could get bogged down in a viral moment

#### API Design

- Entities:
  - site
- POST /site sync
  - Res: site's ID
- GET /site/{id} sync
  - Res: site's view count/other statistics, emails
- POST /site/{id}/view async
  - adds a view to the site's count
- POST /site/{id}/email/{address} async
  - adds email to snapshot list
<!-- - PUT /site/{id} async
  - Req: emails to update -->
- DELETE /site/{id}/email/{address} async
  - removes email to snapshot list
- DELETE /site/{id} async

### Presentation Layer

Hosted in S3 through CloudFront using basic HTML, CSS, and [Alpine.js](https://github.com/alpinejs/alpine) to help with interactivity.

### Email Snapshot

- Cron that gets sites' email lists and send outs email summary


# TODO

- go back over the api design especially how we are going to increment view count