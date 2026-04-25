import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, type ApiMode, type AuthUser, type RemoteAppProps } from '../../../shared';
import App from '../src/App';
import type { ComponentType, LazyExoticComponent } from 'react';

const futureRouterConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

type RemoteComponent = ComponentType<RemoteAppProps> | LazyExoticComponent<ComponentType<RemoteAppProps>>;

type RenderHostAppOptions = {
  route?: string;
  currentUser?: AuthUser | null;
  apiMode?: ApiMode;
  catalogComponent?: RemoteComponent;
  profileComponent?: RemoteComponent;
};

export const hostUser: AuthUser = {
  id: 'host-user',
  name: 'Host Tester',
  roles: ['admin'],
  organization: 'Test Org',
};

export function renderHostApp({
  route = '/',
  currentUser = null,
  apiMode = 'mock',
  catalogComponent,
  profileComponent,
}: RenderHostAppOptions = {}) {
  return render(
    <AuthProvider currentUser={currentUser} signOut={() => undefined} source="host">
      <MemoryRouter initialEntries={[route]} future={futureRouterConfig}>
        <App
          initialApiMode={apiMode}
          catalogComponent={catalogComponent}
          profileComponent={profileComponent}
        />
      </MemoryRouter>
    </AuthProvider>,
  );
}
