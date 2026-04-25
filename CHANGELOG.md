# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- None yet.

### Changed
- None yet.

### Fixed
- None yet.

## [1.1.0] - 2026-04-26

### Added
- Mock-first shared API adapters for auth, catalog, and profile flows.
- Shared bootstrap loading and error screen for the host and standalone remotes.
- Host shell UI tests covering shell rendering, API mode visibility, developer settings, toast behavior, remote loading fallback, and remote error boundaries.
- Catalog remote UI tests covering mounted rendering, host navigation callbacks, and retry-after-error behavior.
- Profile remote UI tests covering mounted rendering, host navigation and sign-out callbacks, and retry-after-error behavior.
- Workspace test tooling based on Vitest, jsdom, and Testing Library.
- CI test execution as part of the standard validation pipeline.

### Changed
- Default local development now uses mocked API responses so frontend work does not depend on live backend access.
- Host bootstrap now resolves auth/session state through shared API helpers before mounting the shell.
- Catalog and profile remotes now load feature data through shared API modules instead of inline local fixtures.
- Host shell now exposes API mode status, developer settings, and clearer runtime state for debugging local environments.
- Remote UIs now support explicit loading, error, and retry flows for async data loading.
- Documentation now reflects the Yarn-first workflow and the standard validation commands.

### Validation
- `yarn test`
- `yarn build`

## [1.0.0] - 2026-04-25

### Added
- Initial React host + micro frontend workspace structure in a single repository.
- Host shell application with shared layout, navigation, and route-based remote mounting.
- Catalog and profile remotes exposed through Vite module federation.
- Yarn workspace setup for root-level install, development, and build workflows.
- Shared contracts, auth provider wiring, and cross-app event utilities.
- Local integrated development workflow for running the host and both remotes together.
- Core project documentation covering architecture, implementation, deployment, CI/CD, testing strategy, and Yarn usage.

### Changed
- Standardized the repository on a Yarn-first workspace workflow for local development and builds.

### Validation
- `yarn dev`
- `yarn build`
