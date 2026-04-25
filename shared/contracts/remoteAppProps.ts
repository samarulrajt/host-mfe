import type { AuthUser } from './auth';

export type RemoteAppProps = {
  standalone?: boolean;
  currentUser?: AuthUser | null;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
};
