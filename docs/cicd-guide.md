# CI/CD guide

This guide explains how to automate build, validation, and deployment for the host + micro frontend workspace.

Use this together with:

- [architecture-implementation-guide.md](./architecture-implementation-guide.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [production-deployment-guide.md](./production-deployment-guide.md)
- [testing-strategy-guide.md](./testing-strategy-guide.md)

## 1. CI/CD goals

For this architecture, CI/CD should guarantee these outcomes:

- every change installs cleanly from the root workspace
- shared contracts do not drift unnoticed
- the host still builds against the configured remotes
- each remote still produces a valid build output
- deployment order stays safe for host/remote compatibility
- release steps are repeatable and observable

The automation should protect the boundary between:

- host shell
- remote applications
- shared contracts
- deployment configuration

## 2. Recommended pipeline stages

A practical pipeline for this workspace should run in this order:

1. checkout
2. dependency install
3. static validation
4. tests
5. build
6. artifact verification
7. deploy remotes
8. verify remote endpoints
9. deploy host
10. smoke test production routes

This order matters because the host depends on remote availability.

## 3. What CI should validate on every change

Every pull request or merge build should confirm:

- root workspace install succeeds
- the workspace lockfile is consistent
- shared TypeScript types still compile
- the host build succeeds
- each remote build succeeds
- documentation or workflow changes do not introduce syntax problems

For this repository right now, the strongest existing baseline check is:

- `npm run build`

As tests are added later, extend CI to run them before the build stage.

## 4. Suggested workflow split

Use two automation layers.

### Continuous integration

Runs on:

- pull requests
- pushes to main branches

Responsibilities:

- install dependencies
- run validation and tests
- build all workspaces
- publish build logs and optional artifacts

### Continuous delivery

Runs on:

- merges to a release branch
- version tags
- manual dispatch

Responsibilities:

- build remotes
- deploy remotes
- verify remote availability
- build host with production remote URLs
- deploy host
- run post-deploy smoke checks

## 5. Artifact strategy

Treat host and remote outputs as separate deployable artifacts.

### Host artifact

Should include:

- host HTML
- host JS/CSS bundles
- any host static assets

### Remote artifacts

Each remote artifact should include:

- `remoteEntry.js`
- generated JS chunks
- generated CSS bundles
- remote static assets

Why this separation matters:

- remotes may release independently
- host may stay stable while a remote updates
- rollback may be needed per application, not only per repository

## 6. Environment variable strategy

The host should not hardcode production remote URLs.

Use environment variables in CI/CD for remote endpoints.

Typical host variables:

```text
VITE_CATALOG_REMOTE_URL=https://catalog-mf.example.com/assets/remoteEntry.js
VITE_PROFILE_REMOTE_URL=https://profile-mf.example.com/assets/remoteEntry.js
```

Suggested approach:

- development uses local defaults
- staging uses staging remote URLs
- production uses production remote URLs
- deployment pipeline injects the correct values per environment

## 7. Recommended branch and release model

A simple model for this workspace is:

- feature branches for day-to-day development
- pull requests for integration review
- `main` for the latest releasable state
- optional release tags for promoted production versions

Recommended release rule:

- only deploy from reviewed, reproducible commits
- use manual approval for production if multiple remotes are involved

## 8. Deployment ordering in CI/CD

The safest order is:

1. build all apps
2. deploy remotes first
3. verify remote URLs respond correctly
4. build or promote host with those remote URLs
5. deploy host
6. run smoke tests

Why:

- the host loads remote entries dynamically
- a host pointing to not-yet-live remotes can fail immediately at runtime

## 9. Smoke verification after deployment

After deployment, CI/CD should verify:

- host URL is reachable
- each remote `remoteEntry.js` is reachable
- host route `/catalog` loads without crashing
- host route `/profile` loads without crashing
- obvious shell breakage is not present

Keep these smoke tests small and fast.
They should answer whether the deployment is safe enough to continue.

## 10. Recommended GitHub Actions structure

A simple starting structure is:

```text
.github/
└─ workflows/
   └─ ci.yml
```

This repository now includes these sample workflows:

```text
.github/
└─ workflows/
   ├─ ci.yml
   ├─ deploy-staging.yml
   └─ deploy-production.yml
```

Use them this way:

- `ci.yml` validates installs and builds on pushes and pull requests
- `deploy-staging.yml` is a manual staging release sample with remotes-first ordering
- `deploy-production.yml` is a manual production release sample with an explicit confirmation input

You can later expand further to:

```text
.github/
└─ workflows/
   ├─ ci.yml
   ├─ deploy-staging.yml
   └─ deploy-production.yml
```

Start simple, then replace the placeholder deploy commands with your real hosting commands when the release process matures.

## 11. What the sample workflow should do now

For this repo today, the sample GitHub Actions workflow should:

- run on push and pull request
- use a Node.js version compatible with the workspace
- install dependencies with `npm ci`
- run `npm run build`
- make it easy to add tests later
- upload build artifacts if you want inspectable outputs

Because this repo currently validates with build success, the workflow should keep that as the baseline gate.

## 12. What the sample deploy workflows do now

The sample deploy workflows are intentionally platform-neutral.

They currently do these things:

- accept deployment URLs through `workflow_dispatch` inputs
- build the workspace with environment-specific remote URLs for the host
- publish host and remote artifacts between jobs
- enforce remotes-first ordering
- verify `remoteEntry.js` endpoints before the host deploy job
- run simple smoke checks against `/`, `/catalog`, and `/profile`

They do not yet do these things:

- upload to a specific cloud or CDN provider
- manage secrets for a real deployment target
- perform rollback automatically

Replace the placeholder `echo` deploy steps in:

- [.github/workflows/deploy-staging.yml](../.github/workflows/deploy-staging.yml)
- [.github/workflows/deploy-production.yml](../.github/workflows/deploy-production.yml)

with the commands for your hosting platform.

## 13. Host build configuration for deployments

The host now supports environment-driven remote URLs during build.

These variables are read in [apps/host/vite.config.ts](../apps/host/vite.config.ts):

- `VITE_CATALOG_REMOTE_URL`
- `VITE_PROFILE_REMOTE_URL`

Local development still falls back to localhost remote URLs, so the current dev workflow remains unchanged.

During staging or production builds, the deploy workflows pass environment-specific remote URLs so the host artifact points at the correct remote entries.

## 14. How to evolve the workflow later

As the project matures, extend the pipeline in this order:

1. add lint stage
2. add unit/component tests
3. add contract validation tests
4. add E2E test stage for critical routes
5. add staged deployments
6. add production approval gates
7. add rollback automation or documented rollback jobs

This keeps the automation proportional to the maturity of the codebase.

## 15. Failure handling guidance

CI/CD should fail fast when:

- workspace install fails
- build fails in any app
- environment variables are missing
- remote deployment endpoint validation fails
- smoke tests fail after deployment

Do not silently continue after a remote deployment failure.
If a remote is required by the host, the host deployment should stop.

## 16. Security and secrets guidance

Keep sensitive values out of the repository.

Use CI/CD secrets for:

- deployment tokens
- cloud credentials
- environment-specific API keys
- private registry credentials if needed

Good practice:

- keep secrets in GitHub Actions secrets or the target platform secret store
- keep remote public URLs as environment configuration, not hardcoded source values
- use least-privilege deployment credentials

## 17. Minimal CI checklist

For this workspace right now, the minimum useful CI checks are:

- [ ] `npm ci` succeeds
- [ ] `npm run build` succeeds
- [ ] workflow syntax is valid
- [ ] docs changes do not introduce markdown/editor errors

## 18. Expanded CD checklist

When you are ready to automate deployment, add:

- [ ] staging remote deploy job
- [ ] staging host deploy job
- [ ] staging smoke verification
- [ ] production approval gate
- [ ] production remote deploy job
- [ ] production host deploy job
- [ ] production smoke verification
- [ ] rollback playbook link or rollback job

## 19. Practical recommendation for this repository

For this specific repository, the best next automation shape is:

- one root CI workflow now
- build the whole workspace from the root
- keep deploy steps documented first
- split deployment workflows by environment later
- only promote host after remote endpoints are verified

That keeps automation simple while still respecting MFE runtime dependencies.

## Final reminder

The most important CI/CD rule for host + MFE systems is this:

- build together when validating
- deploy remotes before the host
- verify runtime endpoints after deployment

If that discipline stays in place, the system remains much safer to evolve.
