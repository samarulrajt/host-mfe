# Yarn usage guide

This workspace now uses Yarn instead of npm.

Use this guide as the quick reference for day-to-day commands in this repository.

For the bigger picture, also see:

- [architecture-implementation-guide.md](./architecture-implementation-guide.md)
- [implementation-checklist.md](./implementation-checklist.md)
- [cicd-guide.md](./cicd-guide.md)

## 1. Requirements

You still need Node.js installed.

Yarn replaces npm in this repository, but it does not replace Node.js itself.

Recommended local prerequisites:

- Node.js 20+
- Yarn 1.22.x

## 2. First-time setup

Install dependencies from the repository root:

```bash
yarn install
```

This creates or updates the workspace dependency tree using [yarn.lock](../yarn.lock).

## 3. Root commands

Run these from the repository root.

### Start the full local system

```bash
yarn dev
```

This starts:

- host dev server on `5173`
- catalog preview on `5174`
- profile preview on `5175`

### Build everything

```bash
yarn build
```

This builds:

- `apps/host`
- `apps/mfe-catalog`
- `apps/mfe-profile`

### Preview the host only

```bash
yarn preview:host
```

## 4. Workspace commands

Use `yarn workspace <name> <script>` when you want to target only one app.

### Host

```bash
yarn workspace host dev
yarn workspace host build
yarn workspace host preview
```

### Catalog remote

```bash
yarn workspace mfe-catalog build
yarn workspace mfe-catalog dev:build
yarn workspace mfe-catalog dev:preview
```

### Profile remote

```bash
yarn workspace mfe-profile build
yarn workspace mfe-profile dev:build
yarn workspace mfe-profile dev:preview
```

## 5. When to use which command

Use these rules:

- use `yarn dev` when you want to test the real host + remote integration
- use `yarn workspace host dev` when you only need the shell
- use remote workspace commands when you are focused on one MFE
- use `yarn build` before pushing changes or when verifying the whole repo

## 6. Why the dev workflow looks unusual

The host runs with Vite dev server, but the remotes are built and served differently.

This repository uses:

- host with `vite dev`
- remotes with `vite build --watch`
- remotes with `vite preview`

That is why the root `yarn dev` command orchestrates multiple workspace commands instead of running a single dev server for everything.

## 7. CI/CD commands

The GitHub Actions workflows now use Yarn too.

Typical CI commands are:

```bash
yarn install --frozen-lockfile
yarn build
```

## 8. Common command conversions

If you are used to npm, use this mapping:

| npm | Yarn |
| --- | --- |
| `npm install` | `yarn install` |
| `npm run dev` | `yarn dev` |
| `npm run build` | `yarn build` |
| `npm run preview:host` | `yarn preview:host` |
| `npm run dev --workspace host` | `yarn workspace host dev` |
| `npm run build --workspace mfe-catalog` | `yarn workspace mfe-catalog build` |
| `npm run build --workspace mfe-profile` | `yarn workspace mfe-profile build` |

## 9. Troubleshooting

### `yarn: command not found`

Install Yarn first.

Example:

```bash
npm install -g yarn@1.22.22
```

### Lockfile mismatch in CI

Make sure you committed [yarn.lock](../yarn.lock) and did not reintroduce `package-lock.json`.

### Dependency issues after switching package managers

Use this cleanup flow from the repository root if needed:

```bash
rm -rf node_modules apps/host/node_modules apps/mfe-catalog/node_modules apps/mfe-profile/node_modules
yarn install
```

### Remote app does not load locally

Check these in order:

- run `yarn dev` from the project root
- wait for the initial remote builds to complete
- confirm ports `5173`, `5174`, and `5175` are free
- verify the host is pointing to the correct remote URLs

## 10. Recommended team rule

For this repository, stick to one package manager only:

- use Yarn locally
- use Yarn in CI
- keep `yarn.lock` committed
- do not add `package-lock.json`

That keeps dependency resolution consistent across machines and pipelines.
