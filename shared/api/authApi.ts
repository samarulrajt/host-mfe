import type { AuthSession, AuthSource, AuthUser } from '../contracts';
import { getApiMode, requestJson, wait } from './core';

export type AuthBootstrapTarget = 'host' | 'catalog-standalone' | 'profile-standalone';

const mockUsersByTarget: Record<AuthBootstrapTarget, AuthUser> = {
  host: {
    id: 'user-001',
    name: 'Samar Ulraj',
    roles: ['admin', 'editor'],
    organization: 'Host MFE Labs',
  },
  'catalog-standalone': {
    id: 'catalog-standalone',
    name: 'Standalone Catalog User',
    roles: ['catalog-editor'],
    organization: 'Catalog Sandbox',
  },
  'profile-standalone': {
    id: 'profile-standalone',
    name: 'Standalone Profile User',
    roles: ['profile-viewer'],
    organization: 'Profile Sandbox',
  },
};

function getSourceForTarget(target: AuthBootstrapTarget): AuthSource {
  return target === 'host' ? 'host' : 'standalone';
}

function buildMockAuthSession(currentUser: AuthUser | null, source: AuthSource): AuthSession {
  return {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    source,
  };
}

export async function getAuthSession(target: AuthBootstrapTarget = 'host') {
  if (getApiMode() === 'mock') {
    await wait(180);
    return buildMockAuthSession(mockUsersByTarget[target], getSourceForTarget(target));
  }

  return requestJson<AuthSession>('/api/auth/session');
}