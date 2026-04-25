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
  const isAuthenticated = auth?.isAuthenticated ?? Boolean(currentUser);
  const [apiMode] = useState<ApiMode>(() => getApiMode());
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [authEvent, setAuthEvent] = useState<AuthChangedDetail>({
    isAuthenticated,
    userName: currentUser?.name ?? null,
    source: standalone ? 'standalone' : 'host',
  });

  useEffect(() => subscribeThemeChanged(setTheme), []);
  useEffect(() => subscribeAuthChanged(setAuthEvent), []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const nextProducts = await listCatalogProducts();
      setProducts(nextProducts);
    } catch (error) {
      setProductsError(error instanceof Error ? error.message : 'Unable to load catalog products.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
          <p className="mfe-api-copy">API mode: {apiMode === 'mock' ? 'mocked local data' : 'remote backend'}</p>
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

      {isLoadingProducts ? <div className="catalog-state">Loading catalog products…</div> : null}

      {productsError ? (
        <div className="catalog-state catalog-state-error">
          <p>{productsError}</p>
          <button type="button" className="catalog-inline-button" onClick={() => void loadProducts()}>
            Retry
          </button>
        </div>
      ) : null}

      {!isLoadingProducts && !productsError ? (
        <div className="catalog-grid">
          {products.map((product) => (
            <article key={product.id} className="catalog-card">
              <div className="catalog-card-header">
                <strong>{product.name}</strong>
                <span className={`catalog-status catalog-status-${product.status}`}>{product.status}</span>
              </div>
              <p>{product.summary}</p>
              <span>{product.price}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
