# Client onboarding delivery plan

This guide turns the host + micro frontend architecture into a practical delivery plan for a real client project.

Use this when you need to answer questions like:

- how do we roll this out with a delivery team?
- what should be done first, second, and third?
- what should architects, frontend engineers, and QA each focus on?
- when is the skeleton stable enough to add more remotes?

Use this together with:

- [client-implementation-playbook.md](./client-implementation-playbook.md)
- [client-project-bootstrap-template.md](./client-project-bootstrap-template.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [testing-strategy-guide.md](./testing-strategy-guide.md)

## 1. Delivery model

The safest way to implement this architecture for a client is in milestones, not all at once.

Recommended sequence:

1. discovery and architecture split
2. workspace and host skeleton
3. first remote integration
4. shared contracts and shared API layer
5. bootstrap flow and developer experience
6. second remote rollout
7. automated validation and client handoff

This prevents the project from becoming a large untestable setup exercise.

## 2. Suggested team roles

For a normal client delivery, responsibilities usually look like this:

### Solution architect or lead engineer

Owns:

- business-domain split
- shell versus remote boundaries
- shared contract rules
- environment strategy
- deployment model
- risk review

### Frontend platform engineer

Owns:

- workspace setup
- federation wiring
- shared API layer
- event bus helpers
- bootstrap flow
- test tooling

### Feature engineers

Own:

- each remote app
- feature-specific UI
- remote-local loading, error, and retry states
- callback integration with host

### QA or test engineer

Owns:

- validation scenarios
- regression coverage strategy
- smoke checks for host and remote integration

### DevOps or platform operations

Owns:

- CI/CD pipelines
- environment variables
- deployment sequencing
- artifact publication

## 3. Milestone 0: Discovery and solution framing

### Goal

Decide whether the client product should use this architecture and what the first feature boundaries are.

### Inputs

- product scope
- team structure
- release model
- backend availability
- deployment restrictions

### Tasks

- identify shell-level UI and global responsibilities
- identify first two feature domains that can become remotes
- define auth/session ownership
- define route ownership
- define environment strategy for local, staging, and production
- decide what must be mockable locally

### Outputs

- one-page architecture decision summary
- list of host responsibilities
- list of remote responsibilities
- initial route map
- first version of shared contracts list

### Exit criteria

You are ready to build when the team can answer:

- what belongs in the host?
- what belongs in each remote?
- what is shared?
- what can be mocked locally?

## 4. Milestone 1: Workspace and host shell skeleton

### Goal

Create the workspace and make the host shell look and behave like the top-level client app before federation is added.

### Tasks

- create the root workspace
- add Yarn workspaces
- add root `dev`, `build`, and `test` scripts
- add root TypeScript config
- create `apps/host`
- add host routing and shell layout
- create placeholder routes
- create initial shell styling

### Outputs

- root monorepo structure
- working host app on `5173`
- shell navigation and top-level route placeholders
- documented install/dev/build commands

### Acceptance checks

- `yarn install` works from the root
- `yarn workspace host dev` runs successfully
- the host shell renders without remotes
- the shell layout already resembles the planned client product frame

### Important rule

Do not add all remotes yet.
The host should stand on its own first.

## 5. Milestone 2: First remote proof of pattern

### Goal

Prove the host-to-remote composition pattern with a single remote.

### Tasks

- create the first remote app
- add federation config for host and remote
- expose one component such as `./CatalogApp`
- mount that remote from one host route
- add loading fallback in the host
- add remote error boundary in the host
- create a standalone mode for the remote
- scope remote CSS under a wrapper class

### Outputs

- one working remote mounted by the host
- one standalone remote that still runs independently
- initial remote entry serving on a stable port

### Acceptance checks

- host route loads the remote successfully
- the remote works in standalone mode
- the host shell survives if the remote fails
- remote CSS does not break the host shell

### Important rule

Do not add deep shared state yet.
First prove loading, styling, and routing boundaries.

## 6. Milestone 3: Shared contracts and host-to-remote communication

### Goal

Make communication between host and remote explicit and stable.

### Tasks

- define `AuthUser`
- define `AuthSession`
- define `RemoteAppProps`
- define the first feature-specific contract types
- pass host-owned state through props
- add `onNavigate` and `onSignOut` callbacks where needed

### Outputs

- shared contracts in one place
- explicit host-to-remote communication path
- reduced runtime ambiguity

### Acceptance checks

- remotes can render using host-provided user data
- remotes can request host-driven navigation
- remotes do not assume a hidden provider across federation boundaries

### Important rule

At this stage, props are more important than fancy global sharing.

## 7. Milestone 4: Shared API layer and mock-first development

### Goal

Separate feature UI from direct backend dependencies.

### Tasks

- create `shared/api/core.ts`
- add `VITE_API_MODE`
- add `VITE_API_BASE_URL`
- create domain adapters like `authApi.ts`, `catalogApi.ts`, and `profileApi.ts`
- add mock-backed data for local development
- update the first remote to load its data through shared adapters

### Outputs

- one shared API layer
- one consistent place for mock and remote behavior
- better local development when client backends are unavailable

### Acceptance checks

- local development works in mock mode by default
- remote mode can be enabled through environment variables
- the first remote no longer depends on inline local fixtures or direct random `fetch` calls

### Important rule

Do not wait for backend perfection before building UI.
This milestone exists specifically to unblock frontend teams.

## 8. Milestone 5: Bootstrap flow and polished runtime experience

### Goal

Make startup and environment handling feel production-ready.

### Tasks

- add shared bootstrap loading UI
- add shared bootstrap error UI
- move host startup behind `getAuthSession()`
- move standalone remote startup behind `getAuthSession()`
- add visible API mode state in the shell
- add developer-facing session or environment context if useful

### Outputs

- smoother startup behavior
- better failure handling
- easier local debugging for engineers

### Acceptance checks

- host does not flash half-mounted content during startup
- standalone remotes show loading and error states before mount
- developers can tell whether they are using mock or remote mode

## 9. Milestone 6: Second remote rollout

### Goal

Add the second remote using the now-proven pattern instead of inventing a new one.

### Tasks

- scaffold the second remote
- reuse shared contracts where appropriate
- reuse shared API patterns
- reuse standalone bootstrap pattern
- add remote-local loading, error, and retry UI
- add host callback handling

### Outputs

- second production-shaped remote
- stronger confidence that the architecture is reusable

### Acceptance checks

- second remote follows the same contract rules
- second remote runs standalone and mounted
- second remote does not add shell ownership leaks

### Important rule

If the second remote needs a different pattern, stop and fix the architecture rather than adding exceptions.

## 10. Milestone 7: Automated validation

### Goal

Add the minimum useful automation before scaling further.

### Tasks

- add shared API tests
- add host UI tests for shell rendering and remote fallback behavior
- add remote tests for mounted mode, callbacks, loading, and retry states
- add CI steps for `yarn test` and `yarn build`

### Outputs

- fast local validation
- basic regression protection
- CI gates that protect the client delivery branch

### Acceptance checks

- tests pass from the root
- host and remotes still build from the root
- CI uses the same commands as the local team workflow

## 11. Milestone 8: Client handoff and operational readiness

### Goal

Make the system understandable and supportable for the client team after build completion.

### Tasks

- document environment variables
- document dev commands
- document deployment order
- document host versus remote ownership
- document how to add a new remote
- document testing expectations
- prepare onboarding notes for future feature teams

### Outputs

- supportable documentation set
- predictable client onboarding path
- reduced dependency on original implementers

### Acceptance checks

- a new engineer can run the workspace with docs only
- a new engineer can explain which logic belongs in the host versus remotes
- a new engineer can add a small feature without guessing the architecture

## 12. Suggested timeline example

This is one practical example for a medium-size client engagement.

### Week 1

Focus:

- discovery
- architecture split
- workspace setup
- host shell skeleton

Expected result:

- host shell running locally
- route skeleton in place
- responsibilities documented

### Week 2

Focus:

- first remote
- federation proof
- CSS isolation
- explicit host-to-remote props

Expected result:

- one remote mounted by the host
- standalone remote working
- shell fallback and error boundary working

### Week 3

Focus:

- shared contracts
- shared API layer
- mock mode
- bootstrap flow

Expected result:

- remote data no longer hardcoded inline
- local development works without backend access
- startup flow is professional and stable

### Week 4

Focus:

- second remote
- shared event flows
- toasts, theme, auth event handling
- automated tests

Expected result:

- both remotes mounted cleanly
- tests exist for success and failure paths
- CI baseline is usable

### Week 5

Focus:

- polish
- documentation
- handoff
- deployment workflow readiness

Expected result:

- client-ready repo
- onboarding docs complete
- release and support plan documented

## 13. Risks to watch during delivery

### Risk: shell logic leaks into remotes

Mitigation:

- keep routing and auth ownership in host
- review remote PRs for shell concerns

### Risk: remotes become dependent on missing backend environments

Mitigation:

- keep mock mode available from the beginning
- require API adapters instead of direct endpoint sprawl

### Risk: CSS collisions break the host

Mitigation:

- require remote wrapper classes
- ban remote styling of global selectors

### Risk: host and remotes drift on contracts
Mitigation:

- keep shared contracts centralized
- add tests around the boundary
- keep callback shapes explicit

### Risk: too many remotes too early

Mitigation:

- prove the pattern with one remote first
- only scale after tests and shared boundaries are stable

## 14. Recommended success definition

The onboarding and delivery plan is working if the team can do all of the following:

- run the host and remotes locally from the root
- work in mock mode when real backend access is unavailable
- mount remotes without breaking the shell
- explain where state ownership lives
- recover from remote failures gracefully
- add the next remote using the same pattern instead of a custom rewrite

## 15. Final advice

For a client project, do not sell this as just a code structure.

Sell it as an operating model:

- the host is the platform shell
- each remote is a feature delivery unit
- the shared layer is the boundary contract and runtime glue
- mock mode protects delivery speed
- tests protect scaling
- docs protect handoff

That is the real value of this architecture.
