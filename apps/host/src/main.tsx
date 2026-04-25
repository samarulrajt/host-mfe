import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, type AuthUser } from '../../../shared';
import App from './App';
import './app.css';

const currentUser: AuthUser = {
  id: 'user-001',
  name: 'Samar Ulraj',
  roles: ['admin', 'editor'],
  organization: 'Host MFE Labs',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider currentUser={currentUser} signOut={() => window.location.assign('/')} source="host">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
