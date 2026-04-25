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
