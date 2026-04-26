# Client implementation playbook

This guide explains how to build the same kind of host + micro frontend site for a client, step by step.

It is written as a practical delivery plan, not just a code reference.

Use this when you need to:

- recreate the same architecture for a new client
- explain the implementation plan to engineering or architecture teams
- decide what logic belongs in the host, in each micro frontend, and in the shared layer
- build the minimum skeleton first and then grow it safely

Use this together with:

- [architecture-implementation-guide.md](./architecture-implementation-guide.md)
- [client-onboarding-delivery-plan.md](./client-onboarding-delivery-plan.md)
- [client-project-bootstrap-template.md](./client-project-bootstrap-template.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [testing-strategy-guide.md](./testing-strategy-guide.md)
- [yarn-usage.md](./yarn-usage.md)

## 1. Start with the business split, not the code split

Before you create folders or install dependencies, decide how the client product should be divided.

For a client project, answer these questions first:

1. what part of the UI is globally shared across the whole product?
2. what parts are feature-owned and can evolve independently?
3. what data is global and should stay host-owned?
4. what data is feature-local and should stay inside a remote?
5. which teams will own which areas?

For most client implementations, the split should look like this:

### Host owns

- main layout
- shell navigation
- top-level routing
- auth/session ownership
- global notifications/toasts
- feature mounting
- remote loading fallback and error handling
- shared theming or shell state

### Each remote owns

- one business domain
- feature-specific UI
- feature-specific loading and error states
- feature-local data fetching through shared adapters
- standalone development mode

If you get this split wrong early, the code will keep fighting you.

## 2. Decide whether the client really needs micro frontends

Do not force this pattern if the client product is small.

Use this architecture when the client needs some combination of:

- multiple teams working in parallel
- clear boundaries between feature domains
- independent feature release cadence
- a long-lived platform with multiple major sections
- host-owned shell plus separately evolving business modules

If the client only has a small site with one delivery team, a normal React application may be simpler.

## 3. Define the target skeleton first

Use this as the initial skeleton for a client implementation:

```text
client-project/
├─ apps/
│  ├─ host/
│  ├─ mfe-catalog/
│  └─ mfe-profile/
├─ shared/
│  ├─ api/
│  ├─ contracts/
│  ├─ events/
│  ├─ providers/
│  └─ ui/
├─ docs/
├─ package.json
├─ tsconfig.base.json
└─ vitest.config.ts
```

What each area is for:

- `apps/host`: the client shell, routing, global chrome, remote mounting
- `apps/mfe-*`: one client feature per remote
- `shared/contracts`: shared TypeScript shapes
- `shared/api`: common API adapters and mock/remote mode logic
- `shared/events`: browser event helpers for cross-app broadcast behavior
- `shared/providers`: auth or shared optional providers
- `shared/ui`: reusable shell-level UI like bootstrap states

This structure is the minimum strong skeleton.

## 4. Implement the project in delivery phases

Build the client version in this order.

### Phase 1: Workspace and baseline tooling

Create the root workspace first.

What to add:

- root `package.json`
- Yarn workspaces
- root `build`, `dev`, and `test` scripts
- root `tsconfig.base.json`
- root `vitest.config.ts`

Why this phase matters:

- every app should install from one place
- shared typing should be consistent from day one
- you want the client project to scale without dependency drift

Minimum root logic:

- install all dependencies once
- run all apps from the root
- support test and build validation from the root

### Phase 2: Host shell only

Before adding remotes, build the host as a normal React app.

Implement:

- layout shell
- sidebar/top nav
- router
- placeholder routes
- shell styles

The host should already feel like the final product shell before federation is introduced.

Why:

- the host is the permanent frame of the client product
- remotes should plug into a stable shell, not define it

Minimum host logic:

- route ownership
- shell rendering
- top-level error tolerance
- host-owned UX state

### Phase 3: One remote only

Do not build all remotes at once.

Start with one remote, prove the pattern, then copy the approach.

Implement one remote with:

- its own Vite app
- federation config
- one exposed component such as `./CatalogApp`
- one standalone entry file
- one mounted-mode component

Why:

- it proves the host/remote contract
- it exposes early problems in routing, CSS, and shared state
- the second and third remotes become repetition instead of invention

### Phase 4: Shared contracts

Once the first remote mounts correctly, define the shared contracts.

At minimum, create:

- `AuthUser`
- `AuthSession`
- `RemoteAppProps`
- domain-specific models like `CatalogProduct` or `ProfileSummary`

Important rule:

- shared contracts should describe boundaries, not business logic implementation

This means:

- shapes belong in `shared/contracts`
- actual rendering and data orchestration stay in apps

### Phase 5: Shared API layer

For a client project, do not let each remote call `fetch` directly in random components.

Instead, create domain adapters in `shared/api`, for example:

- `authApi.ts`
- `catalogApi.ts`
- `profileApi.ts`
- `core.ts`

Required logic here:

- read `VITE_API_MODE`
- read `VITE_API_BASE_URL`
- normalize base URL handling
- expose mock mode for local development
- expose remote mode for real backend integration
- keep request behavior consistent

Why this is important for clients:

- frontend delivery often starts before stable backend environments exist
- mock mode keeps teams shipping UI
- switching to real APIs later becomes configuration, not rewrites

### Phase 6: Bootstrap flow

After the shared API layer exists, move app startup behind bootstrap logic.

Implement this in:

- host `main.tsx`
- each standalone remote `main.tsx`

Required bootstrap logic:

1. render a loading screen immediately
2. request initial auth/session state
3. mount the app once session state is available
4. show a friendly error screen if startup fails

This gives the client site a professional startup flow instead of flashing half-ready UI.

### Phase 7: Host-owned state and callbacks

Once remotes mount, define exactly what the host passes down.

Recommended host-to-remote contract:

```ts
export type RemoteAppProps = {
  standalone?: boolean;
  currentUser?: AuthUser | null;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
};
```

Required logic:

- host owns `currentUser`
- host owns route changes
- host owns sign-out behavior
- remotes receive callbacks and invoke them when needed

Why props matter more than shared context across MFEs:

- props are explicit and stable
- federation boundaries can make provider assumptions brittle
- host-owned state should cross boundaries through contracts, not hidden coupling

### Phase 8: Optional context for standalone remote mode

Each remote should still be able to run by itself.

That means remotes need a safe fallback when not mounted by the host.

Use this logic:

- `useAuth()` for required provider cases
- `useOptionalAuth()` when mounted mode may not have the same local provider path
- fallback to props when mounted by the host
- fallback to local provider in standalone mode

This avoids the classic failure where the remote only works by itself and crashes when host-mounted.

### Phase 9: Event bus for broadcast behavior only

Do not use a global event bus for everything.

Use it only for broadcast-style events like:

- theme changes
- auth status changes
- shell toast notifications

Required event logic:

- strongly typed payloads
- small explicit event names
- subscribe/unsubscribe helpers
- host rendering actual global UI when appropriate

Recommended split:

- props for direct host-to-remote contracts
- events for cross-app broadcast signals

## 5. Core logic the client skeleton needs

If you want the minimum logic set that makes this pattern work, it is this:

### A. Host skeleton logic

The host must implement:

- `BrowserRouter`
- shell layout
- lazy remote imports
- `Suspense` fallback
- remote error boundary
- auth/session provider
- toast listener
- route callbacks passed to remotes

Conceptually:

```tsx
const CatalogApp = lazy(() => import('catalog/CatalogApp'));
const ProfileApp = lazy(() => import('profile/ProfileApp'));

<RemoteBoundary>
  <Suspense fallback={<LoadingState />}>
    <Routes>
      <Route path="/catalog" element={<CatalogApp {...remoteProps} />} />
      <Route path="/profile" element={<ProfileApp {...remoteProps} />} />
    </Routes>
  </Suspense>
</RemoteBoundary>
```

### B. Remote skeleton logic

Each remote must implement:

- one exposed app component
- one standalone entry file
- wrapper root class for CSS isolation
- optional auth handling
- feature-local fetch through shared API adapters
- loading state
- error state
- retry action
- host callback button behavior

Conceptually:

```tsx
export default function CatalogApp({ standalone = false, currentUser, onNavigate }: RemoteAppProps) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await listCatalogProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <section className={standalone ? 'mfe-surface mfe-standalone' : 'mfe-surface'} />;
}
```

### C. Shared skeleton logic

The shared layer must implement:

- stable contracts
- domain API adapters
- event helpers
- auth provider/helpers
- reusable startup UI

This shared layer is the glue that keeps the client solution maintainable.

## 6. Rules that keep the implementation healthy

These are the important design rules.

### Rule 1: Keep shell logic in the host

Do not let remotes own:

- application routing
- primary shell layout
- global auth lifecycle
- host-level notifications
- shell-level navigation rules

### Rule 2: Keep domain logic in remotes

Do not move domain-specific rendering back into the host.

Examples:

- product discovery logic belongs in catalog remote
- profile summary logic belongs in profile remote

### Rule 3: Never scatter raw API calls across UI components

Always funnel remote data through shared adapters.

That makes it easier to:

- mock locally
- standardize request behavior
- move endpoints later
- test logic independently

### Rule 4: Scope remote CSS aggressively

Every remote should have one root wrapper class and all styles should stay under it.

Never let remotes style:

- `body`
- `:root`
- `#root`

### Rule 5: Make remotes resilient

Every remote should tolerate:

- no current user
- missing callback props
- startup latency
- temporary request failures

### Rule 6: Prefer explicit contracts over magic sharing

If host and remotes need to agree on something, define it in a contract and pass it clearly.

Do not rely on invisible runtime assumptions.

## 7. Step-by-step implementation plan for a real client project

Here is the recommended order of execution.

### Step 1: Model the client product

Write down:

- shell pages
- feature domains
- auth model
- user roles
- top-level navigation
- what belongs in each remote

### Step 2: Create the monorepo skeleton

Set up:

- Yarn workspace root
- host app
- first remote app
- `shared/` folder
- docs folder

### Step 3: Build the host as a standalone shell

Make the host look correct before any remotes exist.

### Step 4: Add module federation for one remote

Prove that:

- remote entry can be served
- host can lazy-load it
- route mounting works
- error fallback works

### Step 5: Add shared contracts

Create:

- user/session contracts
- remote prop contract
- first feature data contract

### Step 6: Add shared API adapters

Create:

- base API mode logic
- one domain API adapter
- mock data path
- remote data path

### Step 7: Add bootstrap flow

Move startup logic into shared bootstrap handling.

### Step 8: Add the second remote

Now copy the proven pattern for the next domain.

### Step 9: Add event bus and host UX polish

Only after the basics work, add:

- theme events
- toasts
- developer-facing environment visibility

### Step 10: Add tests before expansion

Before adding more remotes, lock in coverage for:

- shared APIs
- host loading/error behavior
- remote success path
- remote retry path

## 8. Local development logic you should keep for clients

Use the same development rule as this repository:

- host runs with Vite dev server
- remotes use build-watch plus preview

Why:

- remote `remoteEntry.js` is more reliable when served from a real built output
- local integration becomes more stable

Recommended local ports:

- host: `5173`
- remote 1: `5174`
- remote 2: `5175`

## 9. Testing logic you should include from the start

For a client delivery, the minimum automated coverage should be:

### Shared tests

- API mode behavior
- mock and remote adapter behavior
- bootstrap/auth session behavior

### Host tests

- shell rendering
- loading fallback
- remote error boundary
- toast rendering
- host shell settings or state indicators

### Remote tests

- mounted-mode rendering
- callback behavior
- loading state
- error state
- retry success

This is the smallest useful safety net.

## 10. What to hand over to the client team

When the skeleton is ready, hand over these items:

- architecture diagram
- folder structure explanation
- host responsibilities list
- remote responsibilities list
- shared contract rules
- API mode and environment variable guide
- development commands
- test commands
- release and deployment rules

That gives the client team both the code skeleton and the reasoning behind it.

## 11. Final recommendation

If you want to reproduce this site for a client, do not start by copying every file.

Start by copying the pattern:

1. host shell first
2. one remote first
3. shared contracts next
4. shared API layer next
5. bootstrap flow next
6. tests before expansion
7. more remotes only after the first pattern is stable

That order is what turns this from a demo into a reusable delivery skeleton.
