import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, BootstrapScreen, getAuthSession } from '../../../shared';
import ProfileApp from './exposed/App';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BootstrapScreen
      product="profile"
      title="Preparing profile workspace"
      message="Loading the initial session before the profile micro frontend runs in standalone mode."
    />
  </React.StrictMode>,
);

async function bootstrap() {
  try {
    const session = await getAuthSession('profile-standalone');

    root.render(
      <React.StrictMode>
        <AuthProvider currentUser={session.currentUser} signOut={() => window.location.reload()} source={session.source}>
          <ProfileApp standalone />
        </AuthProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    root.render(
      <React.StrictMode>
        <BootstrapScreen
          tone="error"
          product="profile"
          title="Unable to start profile"
          message={error instanceof Error ? error.message : 'The initial profile session could not be loaded.'}
        />
      </React.StrictMode>,
    );
  }
}

void bootstrap();
