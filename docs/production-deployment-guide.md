# Production deployment guide

This guide explains how to deploy the host + micro frontend architecture from this workspace into a production environment.

Use this together with:

- [architecture-implementation-guide.md](./architecture-implementation-guide.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [yarn-usage.md](./yarn-usage.md)

## 1. Deployment model

This project uses a host shell that loads remote applications at runtime.

That means production deployment has two layers:

1. the host application deployment
2. the remote application deployments

In production:

- the host is deployed as its own web app
- each remote is deployed as its own static asset bundle
- the host fetches each remote's `remoteEntry.js` from a public URL

Typical deployment shape:

```text
Browser
  ↓
Host app
  ↓
Loads remoteEntry.js for each MFE
  ├─ catalog remote assets
  └─ profile remote assets
```

## 2. What gets deployed

### Host deployment

The host deployment should include:

- the built shell HTML
- the host JavaScript bundle
- the host CSS bundle
- routing support for the shell application

The host does not physically contain the remote bundles.
It only knows where to fetch them.

### Remote deployment

Each remote deployment should include:

- `remoteEntry.js`
- any generated JS chunks
- any generated CSS assets
- static assets such as images or fonts used by that remote

Every remote must be reachable by a stable public base URL.

## 3. Recommended environment layout

Use separate deployable URLs for the host and each remote.

Example:

- host: `https://app.example.com`
- catalog remote: `https://catalog-mf.example.com/assets/remoteEntry.js`
- profile remote: `https://profile-mf.example.com/assets/remoteEntry.js`

You can also serve remotes from path-based origins.

Example:

- host: `https://app.example.com`
- catalog remote: `https://static.example.com/catalog/assets/remoteEntry.js`
- profile remote: `https://static.example.com/profile/assets/remoteEntry.js`

Choose one pattern and keep it consistent.

## 4. Configure production remote URLs

In development, the host currently points to local URLs.

For production, replace those with production URLs.

The host must know:

- where the catalog remote is deployed
- where the profile remote is deployed
- which environment it is running in

Recommended approach:

- use environment variables for remote base URLs
- build the host with environment-specific values
- avoid hardcoding local development URLs in production builds

If you need the exact local and CI Yarn commands used by this repository, see [yarn-usage.md](./yarn-usage.md).

Example strategy:

```text
VITE_CATALOG_REMOTE_URL=https://catalog-mf.example.com/assets/remoteEntry.js
VITE_PROFILE_REMOTE_URL=https://profile-mf.example.com/assets/remoteEntry.js
```

Then use those variables inside the host Vite federation config.

## 5. Build pipeline responsibilities

### Host pipeline

The host CI/CD pipeline should:

1. install workspace dependencies
2. run linting and tests
3. build the host application
4. publish host artifacts to its hosting platform
5. inject production remote URLs
6. verify shell availability after deploy

### Remote pipeline

Each remote CI/CD pipeline should:

1. install workspace dependencies
2. run remote-specific tests
3. build the remote
4. publish static assets including `remoteEntry.js`
5. verify that the deployed `remoteEntry.js` is publicly reachable
6. optionally notify the host team or deployment system

## 6. Release ordering rules

Because the host loads remotes dynamically, deployment order matters.

Recommended release order:

1. deploy backward-compatible remotes first
2. verify remote assets are live
3. deploy the host after remote endpoints are ready

Safe rule:

- remotes should be additive and backward-compatible whenever possible
- host changes should not require a remote that is not yet deployed

Avoid:

- deploying a host that expects a brand new remote contract before that remote exists
- deleting exported modules that an older host still expects

## 7. Versioning strategy

Use explicit compatibility rules for exposed modules and shared contracts.

Recommended versioning policy:

- treat exposed remote modules as public APIs
- version contract changes carefully
- avoid breaking prop shape changes without coordination
- keep shared contract changes backward-compatible where possible

Good examples:

- adding a new optional prop
- adding a new event payload field that consumers can ignore
- keeping old export names while introducing new ones

Risky examples:

- renaming an exposed module path
- removing required props used by the host
- changing event meaning without updating all consumers

## 8. Cache strategy

Remote deployments must handle caching carefully because the host loads files dynamically.

Recommended caching rules:

- allow long-term caching for hashed chunks
- be more careful with `remoteEntry.js`
- use cache invalidation or shorter cache lifetime for the remote entry file

Why this matters:

- the host discovers the remote through `remoteEntry.js`
- if that file is stale, the host may load incorrect or outdated chunk references

Recommended approach:

- serve `remoteEntry.js` with a short cache policy or cache-busting strategy
- serve hashed assets with aggressive immutable caching

## 9. CORS and asset access

If the host and remotes are on different origins, confirm cross-origin access works in production.

Check these items:

- remote assets are publicly reachable by browser requests
- remote hosting allows host origin access when needed
- static asset paths resolve correctly from the remote base URL
- preview/dev-only settings are not accidentally relied on in production

If the host cannot fetch `remoteEntry.js`, the remote will fail to mount.

## 10. Routing considerations

The host owns the main application routing.

Production routing rules:

- the host domain should support client-side routing fallback for host-managed routes
- remote standalone deployments may need their own routing fallback if directly accessed
- remote mounted mode should not assume ownership of the entire page router unless intentionally designed that way

If a remote has standalone pages, make sure its hosting platform supports refreshing nested routes.

## 11. Shared state and auth in production

Keep the same boundary rule from development:

- host owns shell-level auth/session state
- remotes receive host-owned data through props
- remotes can use optional local providers only for standalone mode

Do not rely on a cross-bundle React context assumption in production.
That runtime boundary issue still applies after deployment.

For auth-sensitive systems:

- keep tokens and session refresh logic in the host or a platform shell layer
- pass only the data/actions a remote actually needs
- avoid duplicating session ownership in every remote

## 12. Observability and runtime safety

Add monitoring around remote loading in production.

Recommended telemetry points:

- host boot success/failure
- remote load start/success/failure
- remote render errors
- remote URL fetch failures
- user-visible fallback activations

Recommended runtime safeguards:

- keep an error boundary around each remote
- show a graceful failure UI when a remote is unavailable
- log enough context to identify which remote failed and why

## 13. Rollback strategy

You need a rollback plan for both host and remotes.

Recommended rules:

- each remote deployment should be independently reversible
- host deployment should be independently reversible
- breaking host/remote contract changes should not be released without coordinated rollback planning

Good rollback design:

- keep previous remote bundles available for a short rollback window
- avoid deleting previous artifact versions immediately
- document the last known compatible host/remote combination

## 14. Production checklist

Before go-live, confirm all of the following:

- [ ] host builds successfully in production mode
- [ ] each remote builds successfully in production mode
- [ ] host points to production remote URLs
- [ ] remote URLs return `remoteEntry.js`
- [ ] remote assets load without 404 errors
- [ ] CORS and origin access work as expected
- [ ] host routes refresh correctly in the deployed environment
- [ ] standalone remote routes refresh correctly where applicable
- [ ] remote CSS remains scoped and does not break the shell
- [ ] host error boundaries handle remote failures cleanly
- [ ] telemetry captures remote load failures
- [ ] rollback steps are documented

## 15. Recommended deployment workflow

Use this order for every release:

1. validate contracts and compatibility
2. run automated tests
3. build remotes
4. deploy remotes
5. verify remote endpoints
6. build host with current remote URLs
7. deploy host
8. smoke test host routes and remote rendering
9. monitor errors and rollback if needed

## 16. Common production mistakes

Avoid these common issues:

- hardcoding localhost remote URLs in host production config
- caching `remoteEntry.js` too aggressively
- deploying a host before the required remote is live
- breaking exposed module names without coordination
- letting remotes own shell-level auth/session state
- using global CSS resets inside remotes
- skipping error boundaries and runtime telemetry

## 17. Practical recommendation for this project

For this workspace specifically, the cleanest production pattern is:

- deploy the host separately
- deploy each remote separately
- inject remote URLs through environment variables
- keep the host shell stable and lightweight
- treat remote exposed modules as versioned public interfaces
- monitor remote loading as a first-class production concern

## Final reminder

In micro frontend production systems, success depends less on just building bundles and more on keeping boundaries stable:

- stable remote URLs
- stable exposed modules
- stable prop contracts
- stable CSS boundaries
- stable deployment order

If those stay disciplined, the host + MFE model remains maintainable and scalable.
