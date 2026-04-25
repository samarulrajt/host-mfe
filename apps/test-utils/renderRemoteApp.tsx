import React, { type ComponentType } from 'react';
import { render } from '@testing-library/react';
import { AuthProvider, type AuthSource, type AuthUser, type RemoteAppProps } from '../../shared';

export const remoteHostUser: AuthUser = {
  id: 'remote-user',
  name: 'Remote Tester',
  roles: ['admin', 'editor'],
  organization: 'Test Org',
};

type RenderRemoteAppOptions<Props extends RemoteAppProps> = {
  component: ComponentType<Props>;
  props?: Props;
  currentUser?: AuthUser | null;
  signOut?: () => void;
  source?: AuthSource;
};

export function renderRemoteApp<Props extends RemoteAppProps>({
  component: Component,
  props,
  currentUser = remoteHostUser,
  signOut = () => undefined,
  source = 'host',
}: RenderRemoteAppOptions<Props>) {
  return render(
    <AuthProvider currentUser={currentUser} signOut={signOut} source={source}>
      <Component {...(props as Props)} />
    </AuthProvider>,
  );
}
