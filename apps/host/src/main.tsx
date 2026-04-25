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
