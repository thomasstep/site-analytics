# Site Analytics

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

### Authentication

Authentication is JWT based. A proper JWKS URL and claims will need to be configured for the Lambda authorizer to know how to validate JWTs. The JWKS URL and claims will be part of the configuration file that is read in and given to the Lambda authorizer. The Lambda authorizer source will be held in `src/authorizer`.

Authentication can be completely disabled if desired although that is not recommended.

### Authorization

Using a type of resource-based authorization where each individual resource (site) can have unique sets of users that have ownership/admin permissions, writing permissions, and reading permissions.

### Data Layer

- DynamoDB
- S3 for data "archival" and analytics

#### Data Model

| Partition key       | Secondary key | { Attributes } |
| ------------------- | ------------- | -------------- |
| `<user-id>`         | `profile`     | `{ owner: string[], admin: string[], writer: string[], reader: string[], created: timestamp }` |
| `<site-id>`         | `site`        | `{ owner: string, admins: string[], writers: string[], readers: string[], emails: string[], url: string, created: timestamp }` |
| `<site-id>#<date>`  | `stats`       | `{ pageViews: { overall: number, <page-name>: number }, <other-statistic>: { <identifier>: number } }` |
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

- API Gateway and Lambda/service proxy integrations (SNS and/or SQS for async calls)
  - Level of async absorption to be configuration item
    - Without Queue: SNS -> Lambda -> DDB (MVP)
    - With Queue: SNS -> SQS -> Lambda -> DDB (future)
- The Lambda that handles site count will have to be very fast or else the whole system could get bogged down in a viral moment

#### API Design

- `POST` `/sites`
  - Create Site ID and item
  - Add site to user's owner set
  - Response: Site ID
- `GET` `/sites`
  - Return user's profile data
  - Response: Lists of sites user has access to
- `GET` `/sites/{id}`
  - Response: Site item in DDB; site's view count/other statistics, emails, URL
- `PUT` `/sites/{id}/owner` (future)
  - Async
  - Request: new owner's user ID
  - Has to be done by the owner
  - Adds user as site's owner
  - Adds site to user's owner set
- `POST` `/sites/{id}/admins/{user-id}` (near future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's admins set
  - Remove site to user's admins set
- `DELETE` `/sites/{id}/admins/{user-id}` (near future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's admins set
  - Remove site to user's admins set
- `POST` `/sites/{id}/writers/{user-id}` (future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's writers set
  - Remove site to user's writers set
- `DELETE` `/sites/{id}/writers/{user-id}` (future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's writers set
  - Remove site to user's writers set
- `POST` `/sites/{id}/readers/{user-id}` (future)
  - Async
  - Can only be done by owners and admins
  - Check that there is at least one other owner
  - Remove user from site's readers set
  - Remove site to user's readers set
- `DELETE` `/sites/{id}/readers/{user-id}` (future)
  - Async
  - Can only be done by the user themselves, owners, or admins
  - Remove user from site's readers set
  - Remove site to user's readers set
- `POST` `/sites/{id}/stat`
  - Async
  - Adds to the site's statistics
  - Could use `Host` header to determine which site should get credit or the site's ID
- `POST` `/sites/{id}/email/{address}` (future)
  - Async
  - Adds email to snapshot list
- `DELETE` `/sites/{id}/email/{address}` (future)
  - Async
  - Removes email to snapshot list
- `DELETE` `/sites/{id}` (future)
  - Deletes site and all data
    - If data is not being archived
      - Reads site's created date
      - Attempts to delete all items for site between created date and current date
      - Might need to be a step function
    - If data is being archived
      - Request deletion of S3 folder with site's ID
      - Delete DynamoDB items between now and archival period


### Presentation Layer

Hosted in S3 through CloudFront using basic HTML, CSS, and [Alpine.js](https://github.com/alpinejs/alpine) to help with interactivity.

Pages:
  - Sign In
  - Sign Up
  - Reset Password
  - Profile
    - Shows sites
  - Site statistics per site ID
    - Graphs and such

### Email Snapshot

- Cron that gets sites' email lists and send outs email summary
