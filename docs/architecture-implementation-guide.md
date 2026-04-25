# Architecture and Implementation Guide

This document explains the architecture, implementation choices, and runtime logic of this host + micro frontend React workspace.

Use it as a blueprint if you want to build the same kind of system in another project.

For the day-to-day command reference for this repository, also see [yarn-usage.md](./yarn-usage.md).

## 1. What this project is

This repository contains one React host application and two React micro frontends (MFEs):

- `apps/host`
- `apps/mfe-catalog`
- `apps/mfe-profile`

The host renders the application shell and loads the MFEs at runtime through module federation.

All apps live in the same repository and are managed with Yarn workspaces.

## 2. High-level architecture

```text
Browser
  |
  v
Host application (:5173)
  |
  +--> loads catalog remote entry from :5174
  |      +--> mounts CatalogApp
  |
  +--> loads profile remote entry from :5175
         +--> mounts ProfileApp
```

### Responsibilities

#### Host

The host is responsible for:

- global layout
- navigation
- route matching
- lazy loading remotes
- fallback and error states
- host-owned auth/session state
- rendering host-level UI such as toasts
- broadcasting selected cross-app events

#### Each remote

Each remote is responsible for:

- one feature domain
- its own local UI and local feature state
- exposing one entry component to the host
- supporting both standalone mode and host-mounted mode
- reacting to host events when needed

## 3. Repository structure

```text
.
├── apps/
│   ├── host/
│   ├── mfe-catalog/
│   └── mfe-profile/
├── shared/
│   ├── contracts/
│   ├── providers/
│   ├── events/
│   └── index.ts
├── docs/
│   └── architecture-implementation-guide.md
├── package.json
└── tsconfig.base.json
```

## 4. Why this structure was chosen

### Why use a host + MFE split

This pattern is useful when:

- different teams own different feature areas
- you want clear feature boundaries
- you want to deploy or evolve features somewhat independently
- you want one shared shell experience with multiple separately owned modules

### Why use Yarn workspaces

Yarn workspaces make it easy to:

- install shared dependencies once
- run all apps from the root
- share internal code through the `shared` folder
- keep everything in one repository

If you want the exact root and per-app commands used in this repository, see [yarn-usage.md](./yarn-usage.md).

## 4.1 How local development works without backend access

One of the common micro frontend problems is that frontend teams cannot always reach staging or production APIs during local development.

This repository handles that by keeping feature data behind a shared API layer and defaulting local development to mocked responses.

The pattern is:

- remotes call shared API helpers instead of scattering raw `fetch` calls through feature components
- shared domain adapters are split by concern such as auth, catalog, and profile
- the API layer reads `VITE_API_MODE`
- `mock` mode returns local fixture-backed data
- `remote` mode calls a real backend through `VITE_API_BASE_URL`

This keeps local UI work unblocked while still preserving a clean switch to real integrations.

### Why use module federation

Module federation lets the host import remote modules at runtime instead of bundling everything into one single app ahead of time.

In this project:

- the host imports `catalog/CatalogApp`
- the host imports `profile/ProfileApp`

Those modules come from remote entry files served by each remote app.

## 5. Host implementation

Key host files:

- `apps/host/src/main.tsx`
- `apps/host/src/App.tsx`
- `apps/host/src/federation.d.ts`
- `apps/host/vite.config.ts`

### Host bootstrap

The host app is wrapped in:

- `BrowserRouter`
- `AuthProvider`

That means the host owns routing and host-side auth/session state from the beginning.

### Host routing

The host routes are defined in `apps/host/src/App.tsx`.

Current routes:

- `/` → host overview page
- `/catalog` → catalog MFE
- `/profile` → profile MFE

### Host remote loading

The host uses `React.lazy()` to load remote modules:

- `catalog/CatalogApp`
- `profile/ProfileApp`

Those imports are backed by the federation config in `apps/host/vite.config.ts`.

### Host error handling

The host includes a `RemoteBoundary` error boundary.

This prevents a remote failure from breaking the full shell and instead shows a visible fallback message.

### Host-level communication logic

The host currently does all of the following:

- passes route-aware callbacks to remotes through `RemoteAppProps`
- provides auth/session state from `AuthProvider`
- broadcasts `theme:changed`
- listens for `toast:show`
- renders the actual toast UI

This is intentional: host-level concerns stay in the host.

## 6. Remote implementation

### Catalog remote

Key files:

- `apps/mfe-catalog/src/main.tsx`
- `apps/mfe-catalog/src/exposed/App.tsx`
- `apps/mfe-catalog/src/styles.css`
- `apps/mfe-catalog/vite.config.ts`

The catalog remote:

- exposes `./CatalogApp`
- is imported by the host as `catalog/CatalogApp`
- supports standalone mode through its own `main.tsx`
- reads auth from optional context or from host-provided props
- listens to theme and auth events
- emits toast events for actions

### Profile remote

Key files:

- `apps/mfe-profile/src/main.tsx`
- `apps/mfe-profile/src/exposed/App.tsx`
- `apps/mfe-profile/src/styles.css`
- `apps/mfe-profile/vite.config.ts`

The profile remote:

- exposes `./ProfileApp`
- is imported by the host as `profile/ProfileApp`
- supports standalone mode through its own `main.tsx`
- reads auth from optional context or from host-provided props
- listens to theme and auth events
- emits toast events for actions like navigation and sign out

## 7. Shared layer

The shared layer exists to avoid duplication and to keep contracts consistent.

### Shared contracts

Located in:

- `shared/contracts/auth.ts`
- `shared/contracts/remoteAppProps.ts`

These files define shared types such as:

- `AuthUser`
- `RemoteAppProps`

### Shared providers

Located in:

- `shared/providers/authContext.tsx`

This provides:

- `AuthProvider`
- `useAuth()`
- `useOptionalAuth()`

### Shared events

Located in:

- `shared/events/theme.ts`
- `shared/events/auth.ts`
- `shared/events/toast.ts`

Grouped re-exports:

- `shared/events/index.ts`
- `shared/index.ts`

## 8. Authentication design

### Important design choice

The host owns the real auth/session state.

This project does **not** rely on a host React context automatically crossing the federated runtime boundary.

That is important because a remote bundle may not see the exact same live React context instance as the host.

### Current approach

The project uses a hybrid model:

- host owns `AuthProvider`
- host passes `currentUser` and `onSignOut` through props to remotes
- remotes use `useOptionalAuth()` for standalone mode
- remotes fall back to props when mounted by the host

This is a safer real-world pattern for MFEs.

## 9. Event bus design

This repo includes three event examples.

### `theme:changed`

Purpose:

- broadcast host-selected theme state to all remotes

Pattern:

- host emits
- remotes subscribe and react

### `auth:changed`

Purpose:

- notify remotes when auth/session state changes

Pattern:

- `AuthProvider` emits
- remotes subscribe and display received auth event info

### `toast:show`

Purpose:

- let remotes request host-rendered notifications

Pattern:

- remotes emit action events
- host subscribes and renders toast UI

This is a good example of host-owned rendering with remote-triggered actions.

## 10. CSS isolation strategy

A major issue in MFE systems is CSS leakage.

### Rule used in this project

The host owns page-level styling.

Each remote only styles its own wrapper container.

Examples:

- `.mfe-surface`
- `.profile-surface`
- `.mfe-standalone`
- `.profile-standalone`

### Avoid in remotes

Do not style these globally from a remote:

- `body`
- `html`
- `:root`
- `#root`

If you do, the remote can accidentally override the host shell layout.

## 11. Why the dev workflow looks unusual

The root `dev` script does not run every app with plain `vite dev`.

Instead it does this:

1. build remote apps once
2. start host with `vite dev`
3. start remotes with `vite build --watch`
4. serve remote output through `vite preview`

### Why

With this federation plugin, the host expects a real `remoteEntry.js` file.

That file is more reliable when served from built remote output than from remote-side `vite dev` alone.

So the workflow is intentionally:

- host = dev server
- remotes = watch build + preview

## 12. Runtime flow

### Opening `/catalog`

1. browser loads host from `:5173`
2. host renders shell and router
3. router matches `/catalog`
4. host lazy loads `catalog/CatalogApp`
5. federation fetches `http://localhost:5174/assets/remoteEntry.js`
6. remote resolves `./CatalogApp`
7. host mounts the remote into the content area

### Opening `/profile`

1. browser loads host from `:5173`
2. host renders shell and router
3. router matches `/profile`
4. host lazy loads `profile/ProfileApp`
5. federation fetches `http://localhost:5175/assets/remoteEntry.js`
6. remote resolves `./ProfileApp`
7. host mounts the remote into the content area

## 13. How to recreate this architecture in another project

Follow this order.

### Step 1: Create the workspace

Create:

- root `package.json`
- `apps/host`
- `apps/mfe-one`
- `apps/mfe-two`
- `shared`

### Step 2: Enable workspaces

Use:

```json
{
  "private": true,
  "workspaces": ["apps/*"]
}
```

### Step 3: Build the host app

The host should contain:

- routing
- layout
- remote loading
- auth ownership
- error boundaries
- host UI like toasts

### Step 4: Build each remote app

Each remote should contain:

- one exposed entry component
- local feature UI
- standalone bootstrap
- scoped CSS
- optional listeners for host events

### Step 5: Add shared contracts

Create shared files for:

- auth user type
- remote prop type
- event detail types

### Step 6: Add shared providers

Create providers for things that are truly app-level and need host ownership.

### Step 7: Add event modules

Split events by concern:

- theme
- auth
- toast
- analytics
- notifications

### Step 8: Add barrel exports

Use grouped and top-level barrels so imports stay clean.

## 14. Recommended rules if you implement this pattern again

### Keep in host

- auth/session state
- shell layout
- router ownership
- app-level notifications
- app-wide policy decisions

### Keep inside each MFE

- feature-local form state
- feature-local UI state
- feature-specific API composition
- feature-specific rendering logic

### Use props for

- navigation callbacks
- auth/user values
- explicit contracts

### Use event bus for

- broadcast notifications
- host-driven global signals
- cross-app actions that should not tightly couple remote modules

### Use shared contracts for

- common types
- common event payload shapes
- shared utility contracts

## 15. Common mistakes to avoid

- assuming React context automatically crosses host/remote boundaries
- letting remotes style `body` or `:root`
- letting each MFE manage its own independent login
- pushing too much state into a global shared layer
- using event bus for everything instead of using props where simpler
- serving remotes incorrectly in dev so `remoteEntry.js` is missing

## 16. Final takeaway

The pattern used here is:

- host owns shell and app-level behavior
- remotes own feature-level UI
- shared layer owns contracts, providers, and events
- module federation composes them at runtime
- props handle direct contracts
- events handle broadcast communication
- CSS is scoped per remote

If you recreate the same structure and keep those boundaries clear, you can scale the system cleanly.
