import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, type AuthUser } from '../../../shared';
import CatalogApp from './exposed/App';

const standaloneUser: AuthUser = {
  id: 'catalog-standalone',
  name: 'Standalone Catalog User',
  roles: ['catalog-editor'],
  organization: 'Catalog Sandbox',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider currentUser={standaloneUser} signOut={() => window.location.reload()} source="standalone">
      <CatalogApp standalone />
    </AuthProvider>
  </React.StrictMode>,
);
