# Implementation checklist

Use this checklist when you want to recreate the same host + micro frontend setup in another project without reading the full architecture guide first.

For the full explanation of why each part exists, see [architecture-implementation-guide.md](./architecture-implementation-guide.md).

For the exact Yarn commands used in this repository, see [yarn-usage.md](./yarn-usage.md).

## 1. Decide the project structure

- [ ] Use one repository for host and all micro frontends.
- [ ] Use Yarn workspaces so every app installs from the root.
- [ ] Keep apps under `apps/*`.
- [ ] Keep shared contracts and utilities in a top-level `shared/` folder.

Recommended structure:

```text
project-root/
├─ apps/
│  ├─ host/
│  ├─ mfe-catalog/
│  └─ mfe-profile/
├─ shared/
│  ├─ contracts/
│  ├─ providers/
│  └─ events/
├─ docs/
└─ package.json
```

## 2. Create the root workspace

- [ ] Add a root `package.json` with `workspaces: ["apps/*"]`.
- [ ] Add shared root scripts such as `dev` and `build`.
- [ ] Add a base TypeScript config like `tsconfig.base.json`.
- [ ] Add a `.gitignore` for `node_modules`, `dist`, and local env files.

What the root should own:

- workspace dependency installation
- cross-app scripts
- shared TypeScript defaults
- top-level documentation

Practical command reference:

- use [yarn-usage.md](./yarn-usage.md) for the exact install, dev, build, and per-workspace commands used by this repo

## 3. Build the host app

- [ ] Create `apps/host` with React + Vite + TypeScript.
- [ ] Add React Router to the host.
- [ ] Keep layout, sidebar, top nav, and route definitions in the host.
- [ ] Lazy-load remote apps with `React.lazy`.
- [ ] Wrap remotes in `Suspense` and an error boundary.
- [ ] Add TypeScript declarations for federated modules.

Host responsibilities:

- application shell
- route ownership
- remote mounting
- global UX pieces such as toasts, theme toggles, shared navigation
- passing host-owned data and callbacks into remotes

## 4. Configure module federation in the host

- [ ] Install `@originjs/vite-plugin-federation`.
- [ ] Register each remote in the host Vite config.
- [ ] Point each remote to its `remoteEntry.js` URL.
- [ ] Set host build target to `esnext`.

Checklist example:

```ts
remotes: {
  catalog: 'http://localhost:5174/assets/remoteEntry.js',
  profile: 'http://localhost:5175/assets/remoteEntry.js'
}
```

Important:

- [ ] Do not forget `build.target = 'esnext'` in the host.
- [ ] If you skip this, federation output may fail because of top-level await.

## 5. Build each remote app

For every remote such as catalog or profile:

- [ ] Create a standalone React + Vite app.
- [ ] Add the federation plugin.
- [ ] Give the remote a unique federation `name`.
- [ ] Expose one entry component such as `./CatalogApp` or `./ProfileApp`.
- [ ] Set `filename: 'remoteEntry.js'`.
- [ ] Set `build.target = 'esnext'`.
- [ ] Add preview server settings so the host can fetch the built remote entry.

Remote responsibilities:

- feature-specific UI
- feature-local state
- optional standalone bootstrapping
- sending events back to the host when needed

## 6. Keep host-mounted and standalone modes separate

- [ ] Let every remote run in two modes:
  - standalone mode for direct development
  - mounted mode when rendered inside the host
- [ ] Use props to detect whether the remote is running inside the host.
- [ ] Add a lightweight standalone wrapper when a remote is opened by itself.

Recommended rule:

- mounted mode should accept host-provided props
- standalone mode may create its own local providers for development/demo use

## 7. Create a shared contract layer

- [ ] Put shared TypeScript types in `shared/contracts`.
- [ ] Define one `RemoteAppProps` contract for host-to-remote communication.
- [ ] Define shared business models such as `AuthUser` once.
- [ ] Re-export shared modules from `shared/index.ts`.

Typical shared items:

- auth/user types
- remote prop contracts
- event payload types
- shared hooks or providers that are safe to reuse

## 8. Pass host-owned state through props

- [ ] Keep auth/session ownership in the host.
- [ ] Pass `currentUser`, `onNavigate`, and `onSignOut` into remotes through props.
- [ ] Treat remotes as consumers of host state, not owners of shell-level state.

Recommended prop shape:

```ts
{
  standalone?: boolean
  currentUser?: AuthUser | null
  onNavigate?: (path: string) => void
  onSignOut?: () => void
}
```

Important rule:

- [ ] Do not assume a React context instance will reliably cross the federation boundary.
- [ ] Use props for host-owned state even if host and remotes share the same type definitions.

## 9. Use optional context only for standalone remote mode

- [ ] If a remote needs auth when running alone, give it its own optional provider.
- [ ] Expose both `useAuth()` and `useOptionalAuth()` patterns if needed.
- [ ] In mounted mode, prefer props first.
- [ ] In standalone mode, fall back to the local provider.

This avoids the common runtime error where a remote expects a provider that only exists in its standalone app.

## 10. Use an event bus for broadcasts and actions

- [ ] Add shared browser events for cross-app notifications.
- [ ] Keep the event bus small and explicit.
- [ ] Use events for broadcast-style updates, not for everything.

Good event-bus use cases:

- `theme:changed`
- `auth:changed`
- `toast:show`

Do not use the event bus for:

- every button click
- normal parent-to-child data flow
- replacing clear prop contracts

## 11. Scope remote CSS aggressively

- [ ] Never style `body`, `:root`, or `#root` inside a remote that will be mounted into the host.
- [ ] Wrap each remote UI in a unique root class such as `.mfe-surface` or `.profile-surface`.
- [ ] Put all remote CSS under that wrapper.
- [ ] Keep host CSS responsible for the page shell.

Bad pattern:

```css
body {
  margin: 0;
}
```

Good pattern:

```css
.mfe-surface {
  padding: 24px;
}
```

This is required to avoid layout overlap, host style pollution, and accidental resets.

## 12. Use a reliable local dev workflow

- [ ] Run the host with Vite dev server.
- [ ] Build remotes once before preview starts.
- [ ] Run remotes with `vite build --watch` plus `vite preview`.
- [ ] Keep each remote on a stable port.

Recommended local setup:

- host dev server on `5173`
- catalog preview on `5174`
- profile preview on `5175`

Why this matters:

- [ ] Plain remote `vite dev` is not always reliable for serving a usable `remoteEntry.js` with this federation plugin.
- [ ] Built remote entries served from preview are more stable in local federation.

## 13. Add safety around remote loading

- [ ] Show a loading state while the remote module downloads.
- [ ] Show a friendly fallback if the remote fails to load.
- [ ] Keep the host shell working even when one remote is unavailable.

Your host should survive these cases:

- remote server is down
- remote entry URL is wrong
- remote build is stale
- remote module throws during render

## 14. Validate the build end to end

- [ ] Run root install from the workspace root.
- [ ] Run the full workspace build.
- [ ] Start the dev flow.
- [ ] Open the host routes that mount each remote.
- [ ] Open each remote standalone.
- [ ] Verify props, navigation callbacks, auth display, theme updates, and toast events.

Minimum validation matrix:

- [ ] Host home page loads.
- [ ] `/catalog` mounts catalog remote.
- [ ] `/profile` mounts profile remote.
- [ ] Standalone catalog works.
- [ ] Standalone profile works.
- [ ] No remote CSS breaks the host shell.
- [ ] Sign-out and navigation callbacks work.
- [ ] Broadcast events are received by remotes.

## 15. Keep the boundary rules clear

Use these rules every time you add a new MFE:

- [ ] Host owns layout, routing, and shell-level state.
- [ ] Remote owns its feature UI and feature logic.
- [ ] Props carry host-owned data into remotes.
- [ ] Events handle app-wide broadcasts and action notifications.
- [ ] Shared folder contains contracts and reusable low-level utilities.
- [ ] Remote CSS stays scoped to a remote root class.

## 16. Recreate this architecture quickly

If you want to repeat the same setup from scratch, do it in this order:

1. [ ] Create the root workspace and workspaces config.
2. [ ] Create the host app and confirm it runs alone.
3. [ ] Create one remote and expose one component.
4. [ ] Connect that remote to the host through federation.
5. [ ] Add remote loading boundary and route-based mounting.
6. [ ] Add the shared contracts layer.
7. [ ] Add host-to-remote props.
8. [ ] Add optional standalone providers inside the remote.
9. [ ] Add event bus support only where needed.
10. [ ] Scope remote CSS.
11. [ ] Add the second remote.
12. [ ] Validate host mode and standalone mode.
13. [ ] Document ports, contracts, and boundary rules.

## Final reminder

If something breaks, check these first:

- [ ] remote URL is correct
- [ ] remote preview server is running
- [ ] remote build produced `remoteEntry.js`
- [ ] host and remotes use `esnext`
- [ ] remote CSS is scoped
- [ ] host-owned state is passed via props
- [ ] event names match exactly

After that, use the full guide in [architecture-implementation-guide.md](./architecture-implementation-guide.md) for the deeper reasoning and design trade-offs.
