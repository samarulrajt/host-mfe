# host-mfe

React workspace that runs a host shell and multiple micro frontends inside the same repository.

For a deeper walkthrough of the architecture, implementation, runtime flow, and design logic, see [docs/architecture-implementation-guide.md](docs/architecture-implementation-guide.md).

If you want a faster build-from-scratch checklist, use [docs/implementation-checklist.md](docs/implementation-checklist.md).

For deployment planning, use [docs/production-deployment-guide.md](docs/production-deployment-guide.md).

For testing recommendations, use [docs/testing-strategy-guide.md](docs/testing-strategy-guide.md).

For automation setup, use [docs/cicd-guide.md](docs/cicd-guide.md), [ci.yml](.github/workflows/ci.yml), [deploy-staging.yml](.github/workflows/deploy-staging.yml), and [deploy-production.yml](.github/workflows/deploy-production.yml).

## Goal

This project shows how to build a React application where:

- one app acts as the host shell
- multiple apps act as micro frontends (MFEs)
- all apps live in the same repository
- the host loads MFEs at runtime using module federation

If you want to build the same kind of system for your own project, this README explains both the architecture and the implementation steps.

## What this gives you

- `apps/host`: the shell application that owns layout, routing, and remote loading
- `apps/mfe-catalog`: a standalone micro frontend exposed to the host as `catalog/CatalogApp`
- `apps/mfe-profile`: a standalone micro frontend exposed to the host as `profile/ProfileApp`
- npm workspaces so everything installs from the root with one command
- Vite Module Federation so the host can render MFEs at runtime

## Architecture

The host runs on port `5173` and dynamically loads these remotes:

- catalog remote from `http://localhost:5174/assets/remoteEntry.js`
- profile remote from `http://localhost:5175/assets/remoteEntry.js`

```text
host-mfe workspace
│
├─ Root workspace
│  ├─ manages npm workspaces
│  ├─ installs shared dependencies
│  └─ starts host + remotes together
│
├─ Host app (apps/host)
│  ├─ runs on :5173
│  ├─ owns layout and routing
│  ├─ imports catalog/CatalogApp
│  └─ imports profile/ProfileApp
│
├─ Catalog MFE (apps/mfe-catalog)
│  ├─ serves remoteEntry.js on :5174
│  └─ exposes ./CatalogApp
│
└─ Profile MFE (apps/mfe-profile)
	├─ serves remoteEntry.js on :5175
	└─ exposes ./ProfileApp

Runtime flow

Browser → Host (:5173)
			 ├─ route /catalog → load remote from :5174 → mount CatalogApp
			 └─ route /profile → load remote from :5175 → mount ProfileApp
```

At a high level:

1. the host renders shared UI such as layout, sidebar, and routes
2. each MFE exposes a React component through module federation
3. the host imports that exposed component lazily
4. navigation decides which remote component gets mounted

## Request lifecycle

### When a user opens `/catalog`

1. the browser loads the host app from `http://localhost:5173`
2. the host renders its shared shell, sidebar, and route container
3. React Router matches the `/catalog` route
4. the host lazy import requests `catalog/CatalogApp`
5. module federation fetches `http://localhost:5174/assets/remoteEntry.js`
6. the catalog remote resolves its exposed `./CatalogApp` module
7. the host mounts the remote React component inside the host content area
8. the catalog MFE renders using its own scoped styles

### When a user opens `/profile`

1. the browser loads the host app from `http://localhost:5173`
2. the host renders the shared shell and routing layer
3. React Router matches the `/profile` route
4. the host lazy import requests `profile/ProfileApp`
5. module federation fetches `http://localhost:5175/assets/remoteEntry.js`
6. the profile remote resolves its exposed `./ProfileApp` module
7. the host mounts the profile component into the route outlet area
8. the profile MFE renders without taking over the full page layout

### If something fails during this flow

The host error boundary shows a user-visible fallback instead of leaving the route blank.

Typical failure points are:

- remote server is not running
- `remoteEntry.js` is not available yet
- remote URL is incorrect
- remote CSS is not scoped properly

## How the pieces work together

### 1. Root workspace

The root `package.json` uses npm workspaces:

- `apps/*` makes every app under `apps` part of one workspace
- dependencies are installed from the root
- one root command starts the full system

This makes host and MFEs easy to manage in one repository while still keeping them isolated by app.

### 2. Host application

The host is responsible for:

- shared layout
- routing
- lazy loading remotes
- error handling when a remote fails to load

The host federation config lives in `apps/host/vite.config.ts`.

It declares remotes like this conceptually:

- `catalog -> http://localhost:5174/assets/remoteEntry.js`
- `profile -> http://localhost:5175/assets/remoteEntry.js`

The host app then imports remotes using module names such as:

- `catalog/CatalogApp`
- `profile/ProfileApp`

### 3. Remote applications

Each MFE has its own Vite app and its own federation config.

Each remote defines:

- a unique federation name
- a `filename` of `remoteEntry.js`
- one or more exposed modules

For example:

- catalog exposes `./CatalogApp`
- profile exposes `./ProfileApp`

That means the host can import them through the configured remote names.

### 4. Why styles are imported in the exposed app

The host mounts the remote component, not the remote standalone entry page.

Because of that, remote styles should be imported from the exposed component tree so they are available when the host loads the remote.

## Why development is set up this way

Each MFE can be developed in two ways:

- standalone by opening its own Vite app
- integrated by opening the host and navigating to the federated route

However, there is an important detail with this plugin:

- the host works well with `vite dev`
- the remote side is more reliable when it serves a real built `remoteEntry.js`

Because of that, this project uses the following dev strategy:

- host runs with `vite dev`
- each remote runs with `vite build --watch`
- each remote is served through `vite preview`

This is why the root `dev` script first builds the remotes once, then starts:

- host dev server
- remote watch builds
- remote preview servers

That guarantees `assets/remoteEntry.js` exists when the host tries to load it.

## Install

```bash
npm install
```

## Run everything

```bash
npm run dev
```

This starts:

- host on `http://localhost:5173`
- catalog MFE preview on `http://localhost:5174`
- profile MFE preview on `http://localhost:5175`

In development, the host runs with Vite dev server, while each MFE runs with `vite build --watch` plus `vite preview`.
That ensures the host always loads a real `remoteEntry.js` file from the remote `dist` output.

## Build

```bash
npm run build
```

This builds:

- the host app
- the catalog MFE
- the profile MFE

## Run apps individually

If you want to work on one piece at a time:

### Host only

```bash
npm run dev --workspace host
```

### Catalog remote only

```bash
npm run build --workspace mfe-catalog
npm run dev:build --workspace mfe-catalog
npm run dev:preview --workspace mfe-catalog
```

### Profile remote only

```bash
npm run build --workspace mfe-profile
npm run dev:build --workspace mfe-profile
npm run dev:preview --workspace mfe-profile
```

## Project structure

```text
.
├── apps
│   ├── host
│   ├── mfe-catalog
│   └── mfe-profile
├── package.json
└── tsconfig.base.json
```

## Folder-by-folder explanation

### `apps/host`

This is the shell application.

It is responsible for:

- application layout
- navigation and routing
- loading remote MFEs
- showing loading and error states for remotes

Think of this folder as the main container of the full product.

### `apps/mfe-catalog`

This is a feature-owned micro frontend.

It is responsible for:

- catalog-specific UI
- exposing a component to the host through module federation
- running standalone for isolated development

This is where a team could independently build and maintain product discovery features.

### `apps/mfe-profile`

This is another feature-owned micro frontend.

It is responsible for:

- profile-specific UI
- exposing its entry component to the host
- supporting standalone and host-mounted modes

This shows how a second team or feature area can plug into the same host shell.

### Root files

The root of the repo coordinates all apps.

- `package.json` runs the whole workspace
- `tsconfig.base.json` keeps TypeScript settings shared
- `README.md` documents the architecture and workflow

In short:

- root = orchestration
- host = shell
- each MFE = isolated feature boundary

## Important files

### Root

- `package.json`: workspace definition and combined dev/build scripts
- `tsconfig.base.json`: shared TypeScript configuration

### Host

- `apps/host/vite.config.ts`: host federation config and remote URLs
- `apps/host/src/App.tsx`: host layout, routes, lazy remote loading, error boundary
- `apps/host/src/federation.d.ts`: TypeScript module declarations for remote imports

### Catalog remote

- `apps/mfe-catalog/vite.config.ts`: catalog federation expose config
- `apps/mfe-catalog/src/exposed/App.tsx`: exposed React component consumed by the host

### Profile remote

- `apps/mfe-profile/vite.config.ts`: profile federation expose config
- `apps/mfe-profile/src/exposed/App.tsx`: exposed React component consumed by the host

## Shared state and auth

If you plan to build a real product on top of this structure, shared state and authentication should usually be owned by the host, not by each MFE independently.

### Recommended ownership model

Use this split:

- host owns authentication state
- host owns current user, token lifecycle, and session refresh
- host owns top-level app configuration
- each MFE owns only feature-specific local state

Examples:

- host owns `currentUser`, roles, permissions, selected organization, and theme
- catalog MFE owns catalog filters, selected product, and pagination state
- profile MFE owns profile form state, local validation, and profile-specific view state

### Good ways to share data from host to MFEs

#### Option 1: Pass props from the host

This is the simplest and safest option.

The host can pass data like:

- current user
- auth status
- feature flags
- callbacks such as `onNavigate`, `onSignOut`, or `onToast`

Use this when:

- the remote is mounted directly by the host
- the amount of shared data is small
- you want clear contracts between host and MFE

#### Option 2: Share a common package in the workspace

Create a shared package such as `packages/shared` or `packages/auth` for:

- TypeScript types
- API clients
- auth helpers
- shared hooks
- event contracts

This is useful when multiple MFEs need the same types or helper logic.

Keep this package focused on reusable contracts and utilities, not feature-specific business state.

#### Option 3: Use a browser event bridge for loose coupling

If MFEs need to react to host-level events, you can use:

- custom DOM events
- a tiny event bus
- `BroadcastChannel` for broader browser tab communication

Example events:

- `auth:changed`
- `user:updated`
- `theme:changed`

Use this when:

- remotes should stay loosely coupled
- not every interaction fits cleanly into props
- multiple MFEs need to react to the same host event

### What not to do

Avoid these patterns unless there is a strong reason:

- each MFE managing its own login screen independently
- each MFE storing separate auth tokens
- each MFE directly controlling page-level routing rules
- sharing large mutable global state across all MFEs by default

These usually lead to inconsistent sessions, duplicated logic, and hard-to-debug state mismatches.

### Practical auth pattern

For most React host + MFE apps, this is a good pattern:

1. host logs the user in
2. host stores the session/token in one place
3. host fetches the current user and permissions
4. host passes auth context or props to remotes
5. remotes call APIs through shared helpers or host-approved clients
6. remotes emit events or callbacks when host-level actions are needed

That keeps security-sensitive logic centralized.

### Important caveat about React context across federation

Do not assume a host React context will automatically be readable inside a federated remote at runtime.

Even if host and remote both import similarly named context code, they may not be using the exact same live context instance once they are loaded through module federation.

In practice, that means this can fail:

- host wraps the app with `AuthProvider`
- remote calls `useAuth()` expecting the host provider to be visible
- remote throws because its bundle cannot see the host provider instance the way a normal local component tree can

Because of that, this project uses a hybrid approach:

- host owns the real auth/session state
- host passes auth data such as `currentUser` into remotes as props
- remotes use optional local auth context only for standalone mode
- remotes use callbacks like `onSignOut` for host-owned actions

This is the safer pattern for federated boundaries.

### Practical React pattern

If you want a clean implementation, use:

- a host-level React context for auth and app shell state
- typed props for remote entry components
- a shared package for types and API helpers

This project now uses that pattern directly:

- `shared/contracts/auth.ts` contains shared auth user types
- `shared/contracts/remoteAppProps.ts` contains the cross-app prop contract
- `shared/providers/authContext.tsx` contains `AuthProvider`, `useAuth()`, and `useOptionalAuth()`
- `shared/contracts/index.ts`, `shared/providers/index.ts`, and `shared/events/index.ts` provide grouped barrel exports
- `shared/index.ts` provides a top-level barrel for the shared layer
- app code now prefers importing from `shared/index.ts`
- the host wraps the app with `AuthProvider`
- remotes read auth state through `useAuth()`
- remotes still receive navigation-style callbacks through props

Current cross-app prop contract:

```ts
type RemoteAppProps = {
	onNavigate?: (path: string) => void;
	standalone?: boolean;
};
```

Current auth context shape:

```ts
type AuthUser = {
	id: string;
	name: string;
	roles: string[];
	organization: string;
};
```

That keeps auth centralized while still allowing the host to pass route-aware callbacks into remotes.

### Best practice summary

- keep auth in the host
- keep feature state inside each MFE
- share contracts, not tightly coupled implementation details
- pass only the minimum cross-app data needed
- centralize token/session handling in one place

### Communication tradeoffs

Use this quick guide when deciding how host and MFEs should communicate.

#### Props

Best for:

- route-level remotes mounted directly by the host
- navigation callbacks
- small amounts of auth or user data
- explicit and easy-to-understand contracts

Pros:

- simple
- type-safe
- easy to trace
- easiest to debug

Cons:

- can become verbose if too much data is passed
- less convenient for cross-remote broadcast events

#### Shared package

Best for:

- shared TypeScript types
- API clients
- common auth helpers
- reusable hooks and utility logic

Pros:

- avoids duplication
- keeps contracts consistent across apps
- works well in monorepos

Cons:

- can become a dumping ground if not kept focused
- should not become one giant shared mutable state layer

#### Event bus / custom events

Best for:

- loosely coupled cross-app notifications
- global events such as auth refresh, toast messages, or theme changes
- cases where multiple MFEs need to react to one host event

Pros:

- decoupled
- flexible
- good for broadcast-style communication

Cons:

- harder to trace than props
- easier to misuse for request/response flows
- can become noisy without clear event naming rules

Concrete example in this project:

- `shared/events/theme.ts` defines `theme:changed`
- `shared/events/auth.ts` defines `auth:changed`
- `shared/events/toast.ts` defines `toast:show`
- the grouped event exports are available from `shared/events/index.ts`
- the top-level shared barrel is available from `shared/index.ts`
- the event implementations are split into:
	- `shared/events/theme.ts`
	- `shared/events/auth.ts`
	- `shared/events/toast.ts`
- the host broadcasts the current theme from `apps/host/src/App.tsx`
- `shared/providers/authContext.tsx` broadcasts auth changes from `AuthProvider`
- the host listens for toast events and renders a toast in `apps/host/src/App.tsx`
- catalog listens and renders the latest theme event in `apps/mfe-catalog/src/exposed/App.tsx`
- catalog also listens for the latest auth event in `apps/mfe-catalog/src/exposed/App.tsx`
- catalog emits a toast event when its action button is used
- profile listens and renders the latest theme event in `apps/mfe-profile/src/exposed/App.tsx`
- profile also listens for the latest auth event in `apps/mfe-profile/src/exposed/App.tsx`
- profile emits toast events for navigation and sign-out actions

This demonstrates two good event-bus use cases:

- `theme:changed` for host-driven UI broadcast state
- `auth:changed` for app-wide session/auth notifications
- `toast:show` for action-based UI notifications rendered by the host

In both cases, multiple MFEs can react without direct coupling between the MFEs themselves.

#### React context

Best for:

- local app trees inside the same runtime boundary
- standalone app mode inside one app bundle
- host-owned internal state

Pros:

- ergonomic inside a single app tree
- good for app-level React state within one runtime

Cons:

- should not be assumed to cross federated host/remote boundaries safely
- can fail when host and remote do not share the exact same runtime context instance

### Recommended order of choice

In most host + MFE systems, prefer this order:

1. props for direct host-to-remote communication
2. shared package for shared contracts and helpers
3. event bus for cross-app broadcast events
4. React context only inside a single app/runtime boundary

## Step-by-step: build the same system yourself

If you want to create another project with the same pattern, follow this process.

### Step 1: Create a workspace structure

Create a root app folder with:

- one root `package.json`
- an `apps` folder
- one folder for the host
- one folder per remote

Example:

```text
apps/
	host/
	mfe-catalog/
	mfe-profile/
```

### Step 2: Enable workspaces

In the root `package.json`, set:

```json
{
	"private": true,
	"workspaces": ["apps/*"]
}
```

This allows all apps to share one dependency installation flow.

### Step 3: Create the host React app

Inside the host app:

- install React, React DOM, React Router, Vite, TypeScript
- install `@originjs/vite-plugin-federation`
- configure the host with remote URLs in `vite.config.ts`

The host should:

- own navigation
- define the routes
- lazy load remote components
- show a fallback or error UI if a remote fails

### Step 4: Create each remote React app

Inside every remote app:

- create its own Vite + React setup
- add the federation plugin
- give it a unique `name`
- expose a component from `src/exposed/App.tsx`
- set `filename: 'remoteEntry.js'`

The exposed component should be a complete feature boundary that the host can mount directly.

### Step 5: Import remote styles from the exposed component

Do not depend only on the remote standalone entry file for styles.

Instead, import the remote CSS from the exposed app tree so styles are available when the host mounts the remote.

### Step 5.1: Keep remote CSS isolated

This is very important when building MFEs.

When a remote is mounted inside the host, its CSS is loaded into the same page as the host.
That means global selectors from the remote can accidentally override the host layout.

Avoid global selectors in remote CSS such as:

- `:root`
- `body`
- `html`
- `#root`
- broad element selectors that assume full-page ownership

Prefer styling only through a remote wrapper class such as:

- `.mfe-surface`
- `.profile-surface`
- `.orders-surface`

Recommended pattern:

- wrap the remote UI in one top-level class
- scope all remote styles under that class
- use a separate modifier like `.mfe-standalone` only for standalone mode
- let the host own page-level layout, body background, and shell spacing

This project uses that exact approach so the host shell styles are not overridden by remote CSS.

Example:

Bad:

```css
:root {
	background: #111827;
}

body {
	margin: 0;
	min-height: 100vh;
}

#root {
	min-height: 100vh;
}
```

Good:

```css
.profile-surface {
	color: #f8fafc;
	background: rgba(17, 24, 39, 0.92);
}

.profile-surface,
.profile-surface * {
	box-sizing: border-box;
}

.profile-standalone {
	min-height: 100vh;
	padding: 2rem;
	background: linear-gradient(180deg, #111827 0%, #1f2937 100%);
}
```

Catalog example:

```css
.mfe-surface {
	color: #0f172a;
	background: rgba(255, 255, 255, 0.88);
}

.mfe-surface,
.mfe-surface * {
	box-sizing: border-box;
}

.mfe-standalone {
	min-height: 100vh;
	padding: 2rem;
	background: linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%);
}
```

The key idea is simple:

- host owns page-level CSS
- remote owns only its feature container CSS
- standalone mode gets its own wrapper class instead of styling the whole page globally

### Step 6: Add TypeScript declarations in the host

In the host app, declare the remote modules in a `.d.ts` file.

Example idea:

```ts
declare module 'catalog/CatalogApp';
declare module 'profile/ProfileApp';
```

This keeps TypeScript happy when importing federated modules.

### Step 7: Add routes in the host

Use lazy imports in the host and mount each remote on its own route.

Example idea:

- `/catalog`
- `/profile`

### Step 8: Use the correct development workflow

For this plugin, prefer:

- host with `vite dev`
- remotes with `vite build --watch`
- remotes served using `vite preview`

This avoids remote entry fetch problems during development.

## Extend with another MFE

To add a new remote such as `mfe-orders`:

1. create a new app under `apps/mfe-orders`
2. add React + Vite + federation config
3. expose a component such as `./OrdersApp`
4. choose a port for that remote preview server
5. add the remote URL to `apps/host/vite.config.ts`
6. add a module declaration to `apps/host/src/federation.d.ts`
7. add a lazy import and a route in `apps/host/src/App.tsx`
8. update the root `dev` script so the new remote is built and previewed

## Troubleshooting

### Remote load failed / Failed to fetch dynamically imported module

Usually means one of these:

- the remote port is not running
- `remoteEntry.js` does not exist yet
- the host is pointing to the wrong remote URL
- an old process is still occupying a port

Fixes:

- run `npm run dev` from the project root
- wait for the initial remote build to finish
- make sure ports `5173`, `5174`, and `5175` are free
- restart the full workspace if needed

### Blank remote UI inside the host

Usually means styles or the exposed component wiring are incomplete.

Check:

- the host route imports the correct exposed module
- the remote exposes the correct file path
- the remote CSS is imported by the exposed component tree

### Remote UI looks like an overlay or breaks the host layout

Usually this is a CSS scoping problem.

Common cause:

- a remote stylesheet is styling `body`, `:root`, or `#root`

Fix:

- move those styles to a remote wrapper class
- keep page-level CSS only in the host
- use standalone-specific classes for remote standalone pages

### Port already in use

Stop old processes and restart.

## Summary

This project works by splitting the app into:

- one host for shell and routing
- separate React MFEs for feature ownership
- module federation for runtime composition
- npm workspaces for one-repo management

If you want to build the same thing again, copy the structure, keep the host/remote boundaries clear, and use the remote build-watch plus preview workflow for local development.