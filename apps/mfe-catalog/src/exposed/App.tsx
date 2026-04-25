import { useEffect, useState } from 'react';
import '../styles.css';
import { emitToastShow, subscribeAuthChanged, subscribeThemeChanged, useOptionalAuth, type AuthChangedDetail, type RemoteAppProps, type ThemeMode } from '../../../../shared';

const products = [
  {
    name: 'Starter analytics kit for React',
    price: '$29',
    summary: 'Prebuilt charts and dashboards you can plug into the shell.',
  },
  {
    name: 'Team workspace pack',
    price: '$79',
    summary: 'Shared navigation patterns and reusable collaboration widgets.',
  },
  {
    name: 'Enterprise federation bundle',
    price: '$149',
    summary: 'A larger feature slice built to prove remote composition at scale.',
  },
];

export default function CatalogApp({ standalone = false, currentUser: currentUserProp, onNavigate }: RemoteAppProps) {
  const auth = useOptionalAuth();
  const currentUser = auth?.currentUser ?? currentUserProp ?? null;
  const isAuthenticated = auth?.isAuthenticated ?? Boolean(currentUser);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [authEvent, setAuthEvent] = useState<AuthChangedDetail>({
    isAuthenticated,
    userName: currentUser?.name ?? null,
    source: standalone ? 'standalone' : 'host',
  });

  useEffect(() => subscribeThemeChanged(setTheme), []);
  useEffect(() => subscribeAuthChanged(setAuthEvent), []);

  return (
    <section className={standalone ? 'mfe-surface mfe-standalone' : 'mfe-surface'}>
      {standalone ? <span className="mfe-badge">Running standalone</span> : <span className="mfe-badge">Mounted by host</span>}
      <div className="mfe-heading">
        <div>
          <p className="mfe-label">Catalog micro frontend</p>
          <h1>Feature-owned product discovery.</h1>
          <p className="mfe-user-copy">
            {isAuthenticated && currentUser
              ? `Signed in as ${currentUser.name} from ${currentUser.organization}.`
              : 'Running with local standalone state.'}
          </p>
          <p className="mfe-theme-copy">Received theme event: {theme}</p>
          <p className="mfe-auth-copy">
            Received auth event: {authEvent.isAuthenticated ? `signed in as ${authEvent.userName}` : 'signed out'} via {authEvent.source}
          </p>
        </div>
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
      </div>

      <div className="catalog-grid">
        {products.map((product) => (
          <article key={product.name} className="catalog-card">
            <strong>{product.name}</strong>
            <p>{product.summary}</p>
            <span>{product.price}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
