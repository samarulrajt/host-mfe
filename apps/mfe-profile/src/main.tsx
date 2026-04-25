import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, type AuthUser } from '../../../shared';
import ProfileApp from './exposed/App';

const standaloneUser: AuthUser = {
  id: 'profile-standalone',
  name: 'Standalone Profile User',
  roles: ['profile-viewer'],
  organization: 'Profile Sandbox',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider currentUser={standaloneUser} signOut={() => window.location.reload()} source="standalone">
      <ProfileApp standalone />
    </AuthProvider>
  </React.StrictMode>,
);
