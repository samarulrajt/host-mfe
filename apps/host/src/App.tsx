import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { emitThemeChanged, getApiMode, subscribeToastShow, useAuth, type ApiMode, type RemoteAppProps, type ThemeMode, type ToastDetail } from '../../../shared';

const CatalogApp = lazy(() => import('catalog/CatalogApp'));
const ProfileApp = lazy(() => import('profile/ProfileApp'));

const features = [
  {
    title: 'Host shell',
    description: 'Owns navigation, layout, and route orchestration for the full experience.',
  },
  {
    title: 'Catalog MFE',
    description: 'Runs independently on its own port and is consumed by the host at runtime.',
  },
  {
    title: 'Profile MFE',
    description: 'Shows how a second remote can be plugged into the same shell with minimal wiring.',
  },
];

function HomePage() {
  return (
    <section className="panel hero-panel">
      <span className="eyebrow">React module federation starter</span>
      <h1>One repo, one launch command, separate host and MFEs.</h1>
      <p className="hero-copy">
        The host app renders shared chrome while each micro frontend stays independently deployable and testable.
      </p>
      <div className="api-help-card">
        <strong>Local API workflow</strong>
        <p>
          Local development defaults to mocked data. To switch a remote to a real backend, create a <code>.env.local</code> file in that app and set <code>VITE_API_MODE=remote</code> plus <code>VITE_API_BASE_URL</code>.
        </p>
      </div>
      <div className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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
  state: RemoteBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): RemoteBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel remote-error">
          <span className="eyebrow">Remote load failed</span>
          <h2>Unable to render this micro frontend.</h2>
          <p>{this.state.message || 'Check that the remote dev server is running and exposing its module.'}</p>
        </section>
      );
    }

    return this.props.children;
  }
}

type RemoteComponent = ComponentType<RemoteAppProps> | LazyExoticComponent<ComponentType<RemoteAppProps>>;

type AppProps = {
  catalogComponent?: RemoteComponent;
  profileComponent?: RemoteComponent;
  initialApiMode?: ApiMode;
};

export default function App({ catalogComponent, profileComponent, initialApiMode }: AppProps = {}) {
  const navigate = useNavigate();
  const { currentUser, signOut, source } = useAuth();
  const [apiMode] = useState<ApiMode>(() => initialApiMode ?? getApiMode());
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [toast, setToast] = useState<ToastDetail | null>(null);
  const CatalogComponent = catalogComponent ?? CatalogApp;
  const ProfileComponent = profileComponent ?? ProfileApp;

  useEffect(() => {
    emitThemeChanged(theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = subscribeToastShow((detail) => {
      setToast(detail);
      window.clearTimeout((window as Window & { __toastTimer?: number }).__toastTimer);
      (window as Window & { __toastTimer?: number }).__toastTimer = window.setTimeout(() => {
        setToast(null);
      }, 2600);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const remoteProps: RemoteAppProps = {
    currentUser,
    onNavigate: (path) => navigate(path),
    onSignOut: signOut,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Host shell</p>
          <h2>Workspace navigation</h2>
        </div>
        <div className="theme-panel">
          <span className="theme-label">Broadcast theme</span>
          <button type="button" className="theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
          <p className="theme-description">Current event bus theme: {theme}</p>
        </div>
        <div className={`api-mode-panel ${apiMode === 'mock' ? 'api-mode-panel-mock' : 'api-mode-panel-remote'}`}>
          <span className="theme-label">API mode</span>
          <strong>{apiMode === 'mock' ? 'Mocked local data' : 'Remote backend'}</strong>
          <p className="api-mode-description">
            {apiMode === 'mock'
              ? 'Frontend development is using fixture-backed responses and does not depend on staging or production APIs.'
              : 'This session is calling a real backend configured through Vite environment variables.'}
          </p>
        </div>
        <div className="developer-panel">
          <span className="theme-label">Developer settings</span>
          <dl className="developer-grid">
            <div>
              <dt>Auth source</dt>
              <dd>{source}</dd>
            </div>
            <div>
              <dt>Signed in user</dt>
              <dd>{currentUser?.name ?? 'Anonymous'}</dd>
            </div>
            <div>
              <dt>`VITE_API_MODE`</dt>
              <dd>{apiMode}</dd>
            </div>
            <div>
              <dt>`VITE_API_BASE_URL`</dt>
              <dd>{apiMode === 'mock' ? 'Not required in mock mode' : 'Set in .env.local for each remote'}</dd>
            </div>
          </dl>
          <p className="developer-note">
            To switch a remote to real backend data, create an app-level <code>.env.local</code> and set <code>VITE_API_MODE=remote</code> with <code>VITE_API_BASE_URL</code>.
          </p>
        </div>
        <nav className="nav-links">
          <Link to="/">Overview</Link>
          <Link to="/catalog">Catalog MFE</Link>
          <Link to="/profile">Profile MFE</Link>
        </nav>
        <p className="sidebar-note">
          Each remote can also run standalone for focused development while still plugging into the host.
        </p>
      </aside>

      <main className="content-area">
        <div className={`api-mode-banner ${apiMode === 'mock' ? 'api-mode-banner-mock' : 'api-mode-banner-remote'}`}>
          <strong>API mode:</strong>
          <span>{apiMode === 'mock' ? 'Mocked local data' : 'Remote backend'}</span>
        </div>
        {toast ? (
          <div className={`host-toast ${toast.tone === 'success' ? 'host-toast-success' : 'host-toast-info'}`}>
            <strong>{toast.source}</strong>
            <span>{toast.message}</span>
          </div>
        ) : null}
        <RemoteBoundary>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogComponent {...remoteProps} />} />
              <Route path="/profile" element={<ProfileComponent {...remoteProps} />} />
            </Routes>
          </Suspense>
        </RemoteBoundary>
      </main>
    </div>
  );
}
