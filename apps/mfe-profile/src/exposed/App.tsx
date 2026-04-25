import { useCallback, useEffect, useState } from 'react';
import '../styles.css';
import {
  emitToastShow,
  getApiMode,
  getProfileSummary,
  subscribeAuthChanged,
  subscribeThemeChanged,
  useOptionalAuth,
  type ApiMode,
  type AuthChangedDetail,
  type ProfileSummary,
  type RemoteAppProps,
  type ThemeMode,
} from '../../../../shared';

export default function ProfileApp({ standalone = false, currentUser: currentUserProp, onNavigate, onSignOut }: RemoteAppProps) {
  const auth = useOptionalAuth();
  const currentUser = auth?.currentUser ?? currentUserProp ?? null;
  const signOut = auth?.signOut ?? onSignOut ?? (() => undefined);
  const [apiMode] = useState<ApiMode>(() => getApiMode());
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authEvent, setAuthEvent] = useState<AuthChangedDetail>({
    isAuthenticated: Boolean(currentUser),
    userName: currentUser?.name ?? null,
    source: standalone ? 'standalone' : 'host',
  });

  useEffect(() => subscribeThemeChanged(setTheme), []);
  useEffect(() => subscribeAuthChanged(setAuthEvent), []);

  const loadProfileSummary = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileError(null);

    try {
      const nextSummary = await getProfileSummary(currentUser);
      setProfileSummary(nextSummary);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to load profile summary.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadProfileSummary();
  }, [loadProfileSummary]);

  return (
    <section className={standalone ? 'profile-surface profile-standalone' : 'profile-surface'}>
      {standalone ? <span className="profile-badge">Running standalone</span> : <span className="profile-badge">Mounted by host</span>}
      <div className="profile-grid">
        <article className="profile-card hero-card">
          <p className="profile-label">Profile micro frontend</p>
          <h1>{profileSummary?.greeting ?? (currentUser ? `${currentUser.name}, your workspace is healthy.` : 'Workspace state is loading.')}</h1>
          <p>
            This remote owns user-specific content while the host keeps the shared app chrome stable.
          </p>
          {currentUser ? (
            <p>
              Active roles: {currentUser.roles.join(', ')} · Organization: {currentUser.organization}
            </p>
          ) : null}
          <p className="profile-api-copy">API mode: {apiMode === 'mock' ? 'mocked local data' : 'remote backend'}</p>
          <p className="profile-theme-copy">Received theme event: {theme}</p>
          <p className="profile-auth-copy">
            Received auth event: {authEvent.isAuthenticated ? `signed in as ${authEvent.userName}` : 'signed out'} via {authEvent.source}
          </p>
          {profileError ? (
            <div className="profile-state profile-state-error">
              <p>{profileError}</p>
              <button type="button" onClick={() => void loadProfileSummary()}>
                Retry summary
              </button>
            </div>
          ) : null}
          {isLoadingProfile ? <div className="profile-state">Loading profile summary…</div> : null}
          {!standalone ? (
            <div className="profile-actions">
              <button
                type="button"
                onClick={() => {
                  emitToastShow({
                    source: 'profile',
                    tone: 'info',
                    message: 'Profile requested navigation to catalog.',
                  });
                  onNavigate?.('/catalog');
                }}
              >
                Go to catalog
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  emitToastShow({
                    source: 'profile',
                    tone: 'info',
                    message: 'Profile requested sign out.',
                  });
                  signOut();
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </article>

        <article className="profile-card">
          <h2>Deployment summary</h2>
          <dl>
            <div>
              <dt>Region</dt>
              <dd>{profileSummary?.deployment.region ?? '—'}</dd>
            </div>
            <div>
              <dt>Release</dt>
              <dd>{profileSummary?.deployment.release ?? '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{profileSummary?.deployment.status ?? 'Loading'}</dd>
            </div>
          </dl>
        </article>

        <article className="profile-card activity-card">
          <h2>Recent activity</h2>
          <ul>
            {(profileSummary?.recentActivity ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
