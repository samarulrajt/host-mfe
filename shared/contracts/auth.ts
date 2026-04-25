export type AuthUser = {
  id: string;
  name: string;
  roles: string[];
  organization: string;
};

export type AuthSource = 'host' | 'standalone' | 'remote';

export type AuthSession = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  source: AuthSource;
};
