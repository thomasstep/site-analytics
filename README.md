# Site Analytics

## Getting Started

```bash
cp config.json.example config.json
# Fill in appropriate config
cd src/shared
# I link the config files together so I only need to keep track of the top level one
# I am open to a better way of doing this
ln -s ../../config.json
cd ../..
npm install
cdk synth
cdk deploy --all
```

Adjust values in `config.json` as needed. More information about the config values can be found in the [config section](#config).

Another caveat is that the HTML preprocessing will not resolve a tokenized API Gateway URL since that resolution would need to happen within the CDK. After deploying the API, add the newly created site analytics API URL to the front end using the [config](#config)'s `frontEndAnalyticsServiceUrl`, i.e. `https://10tud8pp0k.execute-api.us-east-1.amazonaws.com/prod`.

## Config

- `useAuthorization` determines whether or not a custom Lambda authorizer will be used for the API Gateway traffic.
  - If `useAuthorization` is set to `true`, then `jwksUrl` is required and `jwtClaims` is optional.
- `jwksUrl` this is the URL of the JWKS that should be used to verify the JWT presented to the API.
- `jwtClaims` this is an object that corresponds to the claims that a JWT should be verified against. Should follow the format of [`jose`'s `jwtverify`](https://github.com/panva/jose/blob/main/docs/interfaces/jwt_verify.JWTVerifyOptions.md).
- `corsAllowOriginHeader` this is the value returned by the API in the header `Access-Control-Allow-Origin`.

### Front End Config

- `headless` creates a basic front end service of static HTML hosted on S3 and delivered through CloudFront.
- `authenticationServiceUrl` is required whenever `headless` is set to `true`. Since the front end's authentication is implemented based on my [authentication service](https://github.com/thomasstep/authentication-service), this is required to point the API calls to a version of that service.
- `authenticationServiceApplicationId` is required whenever `headless` is set to `true`. Since the front end's authentication is implemented based on my [authentication service](https://github.com/thomasstep/authentication-service), this is the ID of a pre-created application made using the service.
- `frontEndAllowedOrigins` this is an array of strings listing the allowed origins of requests to the CloudFront Distribution. See the CDK documentation about Distributions for more information.
- `frontEndDomainNames` this is an array of strings listing the alternative domain names allowed to point to the CloudFront Distribution in case you want to create a `CNAME` for the front end. See the CDK documentation about Distributions for more information.
- `frontEndCertificateArn` this is an ARN of a previously created certificate that is valid for at least one of the domain names. See the CDK documentation about Distributions for more information.
- `frontEndAnalyticsServiceUrl` this is the URL of this API that has been deployed before deploying the front end, i.e. `https://10tud8pp0k.execute-api.us-east-1.amazonaws.com/prod`. This is a weird caveat of preprocessing the HTML and JS before deploying it to S3.

## Design

### Features

As a user I would like to be able to
- self host this solution (MVP)
- use a hosted solution
- send a request to count a page view (MVP)
- know my overall views (MVP)
  - overall view history per day (MVP)
- know my page views per page (MVP)
  - page views per page history per day (MVP)
- know unique user count
- know geographic locations of users
- receive an email update of yesterday's history (needs scaling cron)
- make my analytics public

### Authentication

Authentication is JWT based. A proper JWKS URL and claims will need to be configured for the Lambda authorizer to know how to validate JWTs. The JWKS URL and claims will be part of the configuration file that is read in and given to the Lambda authorizer. The Lambda authorizer source will be held in `src/authorizer`. The Lambda authorizer will use the JWT's `sub` claim as a user's unique ID for authorization.

Authentication can be completely disabled if desired although that is not recommended.

### Authorization

Using a type of resource-based authorization where each individual resource (site) can have unique sets of users that have ownership/admin permissions, writing permissions, and reading permissions.

### Data Layer

- DynamoDB
- S3 for data "archival" and analytics

#### Data Model

| Partition key       | Secondary key | Attributes     |
| ------------------- | ------------- | -------------- |
| `<user-id>`         | `profile`     | `{ owner: string[], admin: string[], writer: string[], reader: string[], created: timestamp }` |
| `<site-id>`         | `site`        | `{ owner: string, admins: string[], writers: string[], readers: string[], emails: string[], name: string, url: string, created: timestamp }` |
| `<site-id>#<date>`  | `stats`       | `{ pageViews: { overall: number, <page-name>: number }, <other-statistic>: { <identifier>: number }, ttl: timestamp }` |
| Potential GSI Below ||
| `<site-id>`         | none          | `{ emails: string[] }` |

#### S3 Folder Design

```
|-- siteid=<site-id>/
    |-- year=<year>/
        |-- month=<month>
            |-- day=<day>
                |-- <hash>.json
```

### API Layer

Code for the API layer is contained in the `/src` folder.

#### API Design

- `POST /sites` (DONE)
  - Create Site ID and item
  - Add site to user's owner set
  - Response: Site ID
- `GET /sites` (DONE)
  - Return user's profile data
  - Response: Lists of sites user has access to
- `GET /sites/{id}` (DONE)
  - Response: Site item in DDB
- `PUT /sites/{id}/owner` (future)
  - Async
  - Request: new owner's user ID
  - Has to be done by the owner
  - Adds user as site's owner
  - Adds site to user's owner set
- `POST /sites/{id}/admins/{user-id}` (near future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's admins set
  - Remove site to user's admins set
- `DELETE /sites/{id}/admins/{user-id}` (near future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's admins set
  - Remove site to user's admins set
- `POST /sites/{id}/writers/{user-id}` (future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's writers set
  - Remove site to user's writers set
- `DELETE /sites/{id}/writers/{user-id}` (future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's writers set
  - Remove site to user's writers set
- `POST /sites/{id}/readers/{user-id}` (future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's readers set
  - Remove site to user's readers set
- `DELETE /sites/{id}/readers/{user-id}` (future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's readers set
  - Remove site to user's readers set
- `PUT /sites/{id}/stats` (DONE)
  - Async
  - Payload structure
    {
      "pageView": "<page-name>",
      "<other-statistic>": "<identifier>",
      ...
    }
  - Adds to the site's statistics
  - Could use `Host` header to determine which site should get credit or the site's ID (future)
- `GET /sites/{id}/stats`
  - Query parameters: start date, end date
  - Reads the site's statistics for given days
  - Only retrieve up to 7 days (MVP)
  - Paginate results for larger datasets (future)
- `POST /sites/{id}/email/{address}` (future)
  - Async
  - Adds email to snapshot list
- `DELETE /sites/{id}/email/{address}` (future)
  - Async
  - Removes email to snapshot list
- `DELETE /sites/{id}` (DONE)
  - Deletes site and all data
    - If data is not being archived
      - Reads site's created date
      - Attempts to delete all items for site between created date and current date
      - Might need to be a step function
    - If data is being archived
      - Request deletion of S3 folder with site's ID
      - Delete DynamoDB items between now and archival period

### Presentation Layer

Code for the presentation layer is contained in the `/site` and `/siteTemplates` folders. Any HTML that needs to be templated should be written in the `/siteTemplates` folder which will be preprocessed using [Mustache.js](https://github.com/janl/mustache.js) and then written to the `/site` folder.

Hosted in S3 through CloudFront using basic HTML and CSS. Charts for the site statistics will be handled using [Chart.js](https://www.chartjs.org/).

Pages:
  - Sign Up
  - Verify
  - Sign In
  - Reset Password
  - Profile
    - Shows sites
    - Corresponds to `/sites` and `/sites/{siteId}`
  - Statistics
    - Query parameter for `siteId` gives link per site
    - Overall page views graph
    - Graph per statistic with different lines for the top 10 values
    - Corresponds to `/sites` and `/sites/{siteId}/stats`

### Email Snapshot

- Cron that gets sites' email lists and send outs email summary

### Integrate With Your Website

```javascript
<script async src="https://your.domain.com/prod/v1/script.js" siteId="your-site-id"></script>
```

### TODO

- Finish `TODO` around adding stats
- Make the front end prettier
