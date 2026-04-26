# Client project bootstrap template

This guide gives you a copyable starter skeleton for building the same host + micro frontend structure in a fresh client project.

Use this after reading [client-implementation-playbook.md](./client-implementation-playbook.md).
For milestone planning and delivery sequencing, also use [client-onboarding-delivery-plan.md](./client-onboarding-delivery-plan.md).

That playbook explains the decisions.
This document gives you the actual starter structure and starter files.

## 1. Recommended starter structure

Use this structure first:

```text
client-project/
├─ apps/
│  ├─ host/
│  │  ├─ src/
│  │  ├─ index.html
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ vite.config.ts
│  ├─ mfe-catalog/
│  │  ├─ src/
│  │  ├─ index.html
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ vite.config.ts
│  └─ mfe-profile/
│     ├─ src/
│     ├─ index.html
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ vite.config.ts
├─ docs/
├─ shared/
│  ├─ api/
│  ├─ contracts/
│  ├─ events/
│  ├─ providers/
│  ├─ ui/
│  └─ index.ts
├─ package.json
├─ tsconfig.base.json
├─ vitest.config.ts
└─ .gitignore
```

## 2. Root workspace starter files

### Root `package.json`

Use this as the starting point:

```json
{
  "name": "client-host-mfe-workspace",
  "private": true,
  "version": "1.0.0",
  "packageManager": "yarn@1.22.22",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "yarn workspace mfe-catalog build && yarn workspace mfe-profile build && concurrently -n host,catalog-build,catalog-serve,profile-build,profile-serve -c blue,green,green,magenta,magenta \"yarn workspace host dev\" \"yarn workspace mfe-catalog dev:build\" \"yarn workspace mfe-catalog dev:preview\" \"yarn workspace mfe-profile dev:build\" \"yarn workspace mfe-profile dev:preview\"",
    "build": "yarn workspace host build && yarn workspace mfe-catalog build && yarn workspace mfe-profile build",
    "preview:host": "yarn workspace host preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "concurrently": "^9.1.2",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

### Root `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "."
  }
}
```

### Root `.gitignore`

```gitignore
node_modules
dist
coverage
.env.local
.env.*.local
```

### Root `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'catalog/CatalogApp': fileURLToPath(new URL('./apps/host/src/test-stubs/CatalogApp.tsx', import.meta.url)),
      'profile/ProfileApp': fileURLToPath(new URL('./apps/host/src/test-stubs/ProfileApp.tsx', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts', 'apps/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```

## 3. Host app starter

### Host `package.json`

```json
{
  "name": "host",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@originjs/vite-plugin-federation": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

### Host `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        catalog: 'http://localhost:5174/assets/remoteEntry.js',
        profile: 'http://localhost:5175/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
  },
});
```

### Host `src/federation.d.ts`

```ts
declare module 'catalog/CatalogApp';
declare module 'profile/ProfileApp';
```

### Host `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, BootstrapScreen, getAuthSession } from '../../../shared';
import App from './App';
import './app.css';

const futureRouterConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BootstrapScreen
      product="host"
      title="Preparing host shell"
      message="Resolving the initial auth session and workspace state before the shell mounts."
    />
  </React.StrictMode>,
);

async function bootstrap() {
  try {
    const session = await getAuthSession('host');

    root.render(
      <React.StrictMode>
        <AuthProvider currentUser={session.currentUser} signOut={() => window.location.assign('/')} source={session.source}>
          <BrowserRouter future={futureRouterConfig}>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    root.render(
      <React.StrictMode>
        <BootstrapScreen
          tone="error"
          product="host"
          title="Unable to start host shell"
          message={error instanceof Error ? error.message : 'The initial auth session could not be loaded.'}
        />
      </React.StrictMode>,
    );
  }
}

void bootstrap();
```

### Host `src/App.tsx`

```tsx
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { emitThemeChanged, getApiMode, subscribeToastShow, useAuth, type ApiMode, type RemoteAppProps, type ThemeMode, type ToastDetail } from '../../../shared';

const CatalogApp = lazy(() => import('catalog/CatalogApp'));
const ProfileApp = lazy(() => import('profile/ProfileApp'));

function LoadingState() {
  return <div className="panel">Loading micro frontend…</div>;
}

type RemoteBoundaryProps = {
  children: ReactNode;
};

type RemoteBoundaryState = {
  hasError: boolean;
  message: string;
};

class RemoteBoundary extends Component<RemoteBoundaryProps, RemoteBoundaryState> {
  state: RemoteBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): RemoteBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel remote-error">
          <h2>Unable to render this micro frontend.</h2>
          <p>{this.state.message}</p>
        </section>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [apiMode] = useState<ApiMode>(() => getApiMode());
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [toast, setToast] = useState<ToastDetail | null>(null);

  useEffect(() => {
    emitThemeChanged(theme);
  }, [theme]);

  useEffect(() => {
    return subscribeToastShow((detail) => {
      setToast(detail);
    });
  }, []);

  const remoteProps: RemoteAppProps = {
    currentUser,
    onNavigate: (path) => navigate(path),
    onSignOut: signOut,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Workspace navigation</h2>
        <button type="button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
          Switch theme
        </button>
        <div>API mode: {apiMode}</div>
        <nav>
          <Link to="/">Overview</Link>
          <Link to="/catalog">Catalog</Link>
          <Link to="/profile">Profile</Link>
        </nav>
      </aside>

      <main className="content-area">
        {toast ? <div>{toast.message}</div> : null}
        <RemoteBoundary>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<div>Host overview</div>} />
              <Route path="/catalog" element={<CatalogApp {...remoteProps} />} />
              <Route path="/profile" element={<ProfileApp {...remoteProps} />} />
            </Routes>
          </Suspense>
        </RemoteBoundary>
      </main>
    </div>
  );
}
```

## 4. Remote app starter

Use the same pattern for each remote.

### Remote `package.json`

```json
{
  "name": "mfe-catalog",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "dev:build": "vite build --watch",
    "dev:preview": "vite preview --port 5174 --strictPort"
  },
  "dependencies": {
    "@originjs/vite-plugin-federation": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

### Remote `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './CatalogApp': './src/exposed/App.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
});
```

### Remote `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, BootstrapScreen, getAuthSession } from '../../../shared';
import CatalogApp from './exposed/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BootstrapScreen
      product="catalog"
      title="Preparing catalog workspace"
      message="Loading the initial session before the catalog micro frontend runs in standalone mode."
    />
  </React.StrictMode>,
);

async function bootstrap() {
  try {
    const session = await getAuthSession('catalog-standalone');

    root.render(
      <React.StrictMode>
        <AuthProvider currentUser={session.currentUser} signOut={() => window.location.reload()} source={session.source}>
          <CatalogApp standalone />
        </AuthProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    root.render(
      <React.StrictMode>
        <BootstrapScreen
          tone="error"
          product="catalog"
          title="Unable to start catalog"
          message={error instanceof Error ? error.message : 'The initial catalog session could not be loaded.'}
        />
      </React.StrictMode>,
    );
  }
}

void bootstrap();
```

### Remote `src/exposed/App.tsx`

```tsx
import { useCallback, useEffect, useState } from 'react';
import '../styles.css';
import {
  emitToastShow,
  getApiMode,
  listCatalogProducts,
  subscribeAuthChanged,
  subscribeThemeChanged,
  useOptionalAuth,
  type ApiMode,
  type AuthChangedDetail,
  type CatalogProduct,
  type RemoteAppProps,
  type ThemeMode,
} from '../../../../shared';

export default function CatalogApp({ standalone = false, currentUser: currentUserProp, onNavigate }: RemoteAppProps) {
  const auth = useOptionalAuth();
  const currentUser = auth?.currentUser ?? currentUserProp ?? null;
  const [apiMode] = useState<ApiMode>(() => getApiMode());
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authEvent, setAuthEvent] = useState<AuthChangedDetail>({
    isAuthenticated: Boolean(currentUser),
    userName: currentUser?.name ?? null,
    source: standalone ? 'standalone' : 'host',
  });

  useEffect(() => subscribeThemeChanged(setTheme), []);
  useEffect(() => subscribeAuthChanged(setAuthEvent), []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(await listCatalogProducts());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load items.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <section className={standalone ? 'mfe-surface mfe-standalone' : 'mfe-surface'}>
      <h1>Catalog remote</h1>
      <p>API mode: {apiMode}</p>
      <p>Theme event: {theme}</p>
      <p>Auth event: {authEvent.userName ?? 'Anonymous'}</p>

      <button
        type="button"
        onClick={() => {
          emitToastShow({
            source: 'catalog',
            tone: 'success',
            message: standalone ? 'Catalog action completed in standalone mode.' : 'Catalog requested navigation to profile.',
          });

          if (!standalone) {
            onNavigate?.('/profile');
          }
        }}
      >
        {standalone ? 'Create listing' : 'Open profile'}
      </button>

      {isLoading ? <div>Loading catalog products…</div> : null}
      {error ? (
        <div>
          <p>{error}</p>
          <button type="button" onClick={() => void loadItems()}>
            Retry
          </button>
        </div>
      ) : null}
      {!isLoading && !error ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

## 5. Shared layer starter

### `shared/contracts/auth.ts`

```ts
export type AuthUser = {
  id: string;
  name: string;
  roles: string[];
  organization: string;
};

export type AuthSource = 'host' | 'standalone' | 'remote';

export type AuthSession = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  source: AuthSource;
};
```

### `shared/contracts/remoteAppProps.ts`

```ts
import type { AuthUser } from './auth';

export type RemoteAppProps = {
  standalone?: boolean;
  currentUser?: AuthUser | null;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
};
```

### `shared/providers/authContext.tsx`

```tsx
import React from 'react';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { emitAuthChanged } from '../events/auth';
import type { AuthSource, AuthUser } from '../contracts/auth';

type AuthContextValue = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  signOut: () => void;
  source: AuthSource;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  currentUser: AuthUser | null;
  signOut: () => void;
  source?: AuthSource;
  children: ReactNode;
};

export function AuthProvider({ currentUser, signOut, source = 'host', children }: AuthProviderProps) {
  useEffect(() => {
    emitAuthChanged({
      isAuthenticated: Boolean(currentUser),
      userName: currentUser?.name ?? null,
      source,
    });
  }, [currentUser, source]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        signOut,
        source,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
```

### `shared/api/core.ts`

```ts
export type ApiMode = 'mock' | 'remote';

export function wait(durationMs: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, durationMs));
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
}

export function getApiMode(): ApiMode {
  const configuredMode = import.meta.env.VITE_API_MODE?.toLowerCase();
  return configuredMode === 'remote' ? 'remote' : 'mock';
}

export async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${path}.`);
  }

  return (await response.json()) as T;
}
```

### `shared/api/authApi.ts`

```ts
import type { AuthSession, AuthSource, AuthUser } from '../contracts';
import { getApiMode, requestJson, wait } from './core';

export type AuthBootstrapTarget = 'host' | 'catalog-standalone' | 'profile-standalone';

const mockUsersByTarget: Record<AuthBootstrapTarget, AuthUser> = {
  host: {
    id: 'user-001',
    name: 'Client Admin',
    roles: ['admin'],
    organization: 'Client Workspace',
  },
  'catalog-standalone': {
    id: 'catalog-standalone',
    name: 'Catalog Sandbox User',
    roles: ['catalog-editor'],
    organization: 'Catalog Sandbox',
  },
  'profile-standalone': {
    id: 'profile-standalone',
    name: 'Profile Sandbox User',
    roles: ['profile-viewer'],
    organization: 'Profile Sandbox',
  },
};

function getSourceForTarget(target: AuthBootstrapTarget): AuthSource {
  return target === 'host' ? 'host' : 'standalone';
}

export async function getAuthSession(target: AuthBootstrapTarget = 'host') {
  if (getApiMode() === 'mock') {
    await wait(180);
    return {
      currentUser: mockUsersByTarget[target],
      isAuthenticated: true,
      source: getSourceForTarget(target),
    } satisfies AuthSession;
  }

  return requestJson<AuthSession>('/api/auth/session');
}
```

### `shared/events/toast.ts`

```ts
export type ToastDetail = {
  message: string;
  source: 'host' | 'catalog' | 'profile';
  tone?: 'info' | 'success';
};

const TOAST_SHOW_EVENT = 'toast:show';

export function emitToastShow(detail: ToastDetail) {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_SHOW_EVENT, {
      detail,
    }),
  );
}

export function subscribeToastShow(handler: (detail: ToastDetail) => void) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ToastDetail>;
    handler(customEvent.detail);
  };

  window.addEventListener(TOAST_SHOW_EVENT, listener);

  return () => {
    window.removeEventListener(TOAST_SHOW_EVENT, listener);
  };
}
```

### `shared/ui/BootstrapScreen.tsx`

```tsx
import type { CSSProperties } from 'react';

type BootstrapScreenProps = {
  title: string;
  message: string;
  tone?: 'loading' | 'error';
  product?: 'host' | 'catalog' | 'profile';
};

export function BootstrapScreen({ title, message, tone = 'loading' }: BootstrapScreenProps) {
  const pageStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '2rem',
    background: '#020617',
    color: '#e2e8f0',
  };

  return (
    <div style={pageStyle}>
      <section>
        <span>{tone === 'error' ? 'Bootstrap error' : 'Starting application'}</span>
        <h1>{title}</h1>
        <p>{message}</p>
      </section>
    </div>
  );
}
```

### `shared/index.ts`

```ts
export * from './contracts';
export * from './api';
export * from './providers';
export * from './events';
export * from './ui';
```

## 6. Minimal test starter

### Shared API test

```ts
import { describe, expect, it } from 'vitest';
import { getApiMode } from './core';

describe('shared api layer', () => {
  it('defaults to mock mode', () => {
    expect(getApiMode()).toBe('mock');
  });
});
```

### Host UI test pattern

```tsx
// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../../../shared';
import App from './App';

describe('host shell UI', () => {
  it('renders the shell', () => {
    render(
      <AuthProvider currentUser={null} signOut={() => undefined} source="host">
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText('Workspace navigation')).toBeInTheDocument();
  });
});
```

## 7. Environment starter files

### `apps/mfe-catalog/.env.example`

```env
VITE_API_MODE=mock
# VITE_API_MODE=remote
# VITE_API_BASE_URL=https://your-api.example.com
```

Use the same pattern for every remote.

## 8. Delivery order for using this template

Use this order:

1. create the root workspace files
2. create the host app and make the shell work without remotes
3. create one remote and prove federation mounting
4. add shared contracts
5. add shared APIs with mock mode first
6. add bootstrap loading/error screens
7. add tests
8. add more remotes only after the first remote pattern is stable

## 9. What to customize for each client

Do not copy this template blindly.

Always customize:

- remote names
- business domains
- auth/session source
- route structure
- API endpoints
- UI styling and shell layout
- deployment URLs
- environment variable names if needed

## 10. Final rule

The template is successful if:

- the host owns the shell
- each remote owns one feature domain
- the shared layer owns contracts and reusable glue
- local development works even before backend integration is ready
- tests exist before the number of remotes grows
