# Testing strategy guide

This guide explains how to test a host + micro frontend architecture like this workspace in a practical way.

Use this together with:

- [architecture-implementation-guide.md](./architecture-implementation-guide.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [production-deployment-guide.md](./production-deployment-guide.md)
- [yarn-usage.md](./yarn-usage.md)

## 1. Testing goals

A micro frontend system needs to prove more than component rendering.

For the exact workspace and CI command patterns used in this repository, see [yarn-usage.md](./yarn-usage.md).

You need confidence in:

- host shell behavior
- remote feature behavior
- host-to-remote contracts
- event communication
- CSS isolation
- remote load failure handling
- deployed integration behavior

The goal is not to test everything at the same level.
The goal is to test each responsibility at the cheapest reliable level.

## 2. Recommended testing layers

Use multiple layers instead of trying to solve everything with end-to-end tests.

Recommended layers:

1. unit tests
2. component tests
3. contract tests
4. integration tests
5. end-to-end tests
6. deployment smoke tests

Each layer answers a different question.

## 3. Unit tests

Unit tests should verify isolated logic with minimal rendering.

Good unit test targets:

- event helper functions
- payload mappers
- route helper logic
- auth helper logic
- shared contract-related helpers
- formatting or transformation utilities

Examples for this workspace:

- theme event emit/listen helpers
- toast event payload creation
- auth provider helper logic
- route path mapping helpers

Keep unit tests fast and local.

## 4. Component tests

Component tests should verify UI behavior inside one app boundary.

Test host components such as:

- shell layout
- sidebar navigation
- route container behavior
- remote loading fallback UI
- remote error boundary fallback UI
- toast renderer

Test remote components such as:

- catalog feature cards or lists
- profile info panels
- remote action buttons
- standalone wrapper behavior
- mounted-mode rendering when props are supplied

Useful component-level assertions:

- renders expected labels and actions
- responds to user input
- calls callbacks with the right values
- hides or shows states correctly
- applies mounted-mode versus standalone-mode behavior correctly

Current examples in this workspace:

- host UI tests cover shell rendering, API mode panels, developer settings, toast rendering, remote suspense fallback, and remote error boundary behavior
- catalog UI tests cover authenticated mounted-mode rendering, host navigation callback behavior, and retry after a failed product request
- profile UI tests cover authenticated mounted-mode rendering, host navigation/sign-out callbacks, and retry after a failed summary request

## 5. Contract tests

Contract tests are especially important in host/MFE systems.

These tests verify that host and remotes still agree on the same public interface.

Important contracts in this project:

- `RemoteAppProps`
- `AuthUser`
- event names and event payloads
- exposed module paths such as `./CatalogApp` and `./ProfileApp`

What to validate:

- required props remain available
- optional props behave safely when omitted
- callback argument shapes stay stable
- event payload fields remain compatible
- exposed module names do not change accidentally

Why this matters:

A system can compile in one package and still fail at runtime if public contracts drift.

## 6. Integration tests

Integration tests should verify that multiple pieces inside the same runtime work together.

Good integration targets:

- host route loads remote wrapper correctly
- host passes `currentUser` into remotes
- remote calls `onNavigate` when expected
- remote calls `onSignOut` when expected
- theme change broadcast reaches remotes
- auth change events are consumed safely
- host toast listener renders messages emitted by remotes

Examples:

- mount the host route for `/catalog` with a mocked remote component
- assert the host renders fallback while the remote loads
- simulate a remote toast event and assert the host UI shows the message
- simulate a theme change and assert the remote reacts to the new theme state

Current workspace coverage already includes:

- host integration-style UI tests using injected remote components and shared auth provider wiring
- remote callback assertions for `onNavigate` and sign-out flows
- retry assertions that prove failed async fetches can recover without remounting the entire app

## 7. End-to-end tests

End-to-end tests should verify the most important user journeys across the real host and remotes.

Recommended E2E scenarios:

- user opens the host home page
- user navigates to catalog route and catalog remote appears
- user navigates to profile route and profile remote appears
- user triggers remote navigation back through host callback
- user triggers toast-producing actions from a remote
- sign-out action flows correctly through host-owned behavior
- theme change in host is reflected in mounted remotes

Keep E2E tests focused on critical flows.
Do not put every small UI detail into end-to-end tests.

## 8. Standalone remote tests

Every remote in this architecture has two operating modes:

- standalone mode
- host-mounted mode

Test both.

For each remote, verify:

- it renders correctly with standalone provider setup
- it renders correctly when only host props are provided
- it does not require standalone-only providers in mounted mode
- its CSS wrapper classes are present in both modes

This is where the optional auth/context pattern matters.
A remote must not break just because it runs without its standalone bootstrap.

## 9. Failure-path tests

Micro frontends need explicit failure testing.

Important failure cases:

- remote module fails to load
- remote entry URL is unavailable
- remote throws during render
- remote callback prop is missing
- event payload is incomplete or ignored safely
- user data is absent or null

Host expectations:

- shell still renders
- error boundary displays fallback UI
- failure does not crash unrelated routes
- failure can be logged/monitored

Current workspace coverage includes both host-side failure rendering and remote-side retry recovery:

- the host test suite verifies suspense fallback and remote render failure fallback
- catalog tests verify a failed product request can be retried successfully
- profile tests verify a failed summary request can be retried successfully

## 10. CSS isolation tests

CSS leakage is a common MFE problem, so test it deliberately.

What to verify:

- remotes do not restyle host shell layout
- remote styles are scoped under wrapper classes
- host layout remains intact after mounting a remote
- standalone remote styles still look correct

Practical test ideas:

- visual regression snapshots for host routes
- DOM assertions that remote root classes exist
- lint/review checks that remotes do not style `body`, `:root`, or `#root`

## 11. Event-bus tests

The event bus is small in this project, but it still deserves targeted tests.

Verify:

- theme event listeners receive payloads
- auth change events are emitted when auth state changes
- toast events render host toasts
- listeners unsubscribe correctly
- unknown or missing payload fields do not crash consumers

Do not over-test browser event internals.
Test your own event semantics instead.

## 12. Recommended tooling approach

A practical stack for this architecture is:

- test runner for unit and component tests
- React-friendly DOM test library for UI assertions
- browser automation for end-to-end tests
- optional visual regression for shell and remote route stability

Suggested split:

- unit/component/integration tests inside each app package
- contract tests near the shared layer or host/remote boundaries
- end-to-end tests at the workspace level

## 13. What each app should own

### Host tests should focus on

- layout and route ownership
- loading and error boundaries
- remote mounting orchestration
- host-owned callbacks
- toast rendering
- theme controls
- shell-level auth behavior

### Remote tests should focus on

- feature rendering
- prop consumption
- local interactions
- standalone mode behavior
- mounted mode behavior
- event subscription and emission
- CSS wrapper presence

### Shared-layer tests should focus on

- contract stability
- provider behavior
- event helper behavior
- payload compatibility

## 14. Minimal test matrix for this workspace

If you want a lean but useful test suite, start with this matrix.

### Host

- [ ] shell renders home route
- [ ] catalog route shows loading fallback before remote resolves
- [ ] remote failure shows error boundary fallback
- [ ] toast event displays host toast UI
- [ ] theme toggle updates host state and emits event

### Catalog remote

- [ ] renders in standalone mode
- [ ] renders in mounted mode with host props
- [ ] invokes `onNavigate('/profile')` correctly
- [ ] shows current user when supplied
- [ ] emits toast event when action occurs

### Profile remote

- [ ] renders in standalone mode
- [ ] renders in mounted mode with host props
- [ ] invokes `onSignOut()` correctly
- [ ] consumes `currentUser` safely when null or present
- [ ] reacts to theme or auth event updates

### Shared layer

- [ ] auth provider emits auth-changed events
- [ ] theme event helpers emit and subscribe correctly
- [ ] toast event helpers emit payloads correctly
- [ ] shared contracts remain type-safe

### End-to-end

- [ ] host loads successfully
- [ ] catalog route mounts catalog remote
- [ ] profile route mounts profile remote
- [ ] host survives remote loading issues gracefully

## 15. Deployment smoke tests

After deployment, run a lightweight smoke suite.

Verify:

- host is reachable
- each remote `remoteEntry.js` is reachable
- host routes mount the expected remote
- core callbacks still work
- no obvious CSS breakage appears
- monitoring does not show immediate remote load failures

These tests are smaller than full E2E suites but extremely valuable after release.

## 16. Testing order recommendation

Build the test suite in this order:

1. unit tests for shared helpers
2. host component tests
3. remote component tests
4. host-to-remote integration tests
5. event-bus interaction tests
6. critical-path end-to-end tests
7. post-deploy smoke tests

This gives fast feedback early and broader confidence later.

## 17. Common testing mistakes

Avoid these mistakes:

- testing only remotes and ignoring the host shell
- relying only on end-to-end tests
- skipping failure-path tests
- not testing standalone versus mounted mode separately
- not validating contract drift
- ignoring CSS isolation regressions
- mocking everything so heavily that integration risk disappears from the test suite

## 18. Practical recommendation for this project

For this workspace, the best testing balance is:

- keep shared helper tests small and fast
- test host shell orchestration directly
- test each remote in both modes
- add a few targeted host/remote integration tests
- keep a small high-value E2E suite for route mounting and callback flows
- add smoke checks after deployment

## Final reminder

A micro frontend system is healthy when these things are tested continuously:

- boundaries
- contracts
- failure handling
- visual isolation
- deployment behavior

If you protect those areas, the architecture remains stable even as more remotes are added.
