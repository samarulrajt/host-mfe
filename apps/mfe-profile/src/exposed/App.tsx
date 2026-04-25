import { useEffect, useState } from 'react';
import '../styles.css';
import { emitToastShow, subscribeAuthChanged, subscribeThemeChanged, useOptionalAuth, type AuthChangedDetail, type RemoteAppProps, type ThemeMode } from '../../../../shared';

const activity = [
  'Invited 3 new teammates to the workspace and assigned roles',
  'Published a dashboard widget to the host shell catalog',
  'Reviewed the latest remote deployment status and logs within the profile',
];

export default function ProfileApp({ standalone = false, currentUser: currentUserProp, onNavigate, onSignOut }: RemoteAppProps) {
  const auth = useOptionalAuth();
  const currentUser = auth?.currentUser ?? currentUserProp ?? null;
  const signOut = auth?.signOut ?? onSignOut ?? (() => undefined);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [authEvent, setAuthEvent] = useState<AuthChangedDetail>({
    isAuthenticated: Boolean(currentUser),
    userName: currentUser?.name ?? null,
    source: standalone ? 'standalone' : 'host',
  });

  useEffect(() => subscribeThemeChanged(setTheme), []);
  useEffect(() => subscribeAuthChanged(setAuthEvent), []);

  return (
    <section className={standalone ? 'profile-surface profile-standalone' : 'profile-surface'}>
      {standalone ? <span className="profile-badge">Running standalone</span> : <span className="profile-badge">Mounted by host</span>}
      <div className="profile-grid">
        <article className="profile-card hero-card">
          <p className="profile-label">Profile micro frontend</p>
          <h1>{currentUser ? `${currentUser.name}, your workspace is healthy.` : 'Samar, your workspace is healthy.'}</h1>
          <p>
            This remote owns user-specific content while the host keeps the shared app chrome stable.
          </p>
          {currentUser ? (
            <p>
              Active roles: {currentUser.roles.join(', ')} · Organization: {currentUser.organization}
            </p>
          ) : null}
          <p className="profile-theme-copy">Received theme event: {theme}</p>
          <p className="profile-auth-copy">
            Received auth event: {authEvent.isAuthenticated ? `signed in as ${authEvent.userName}` : 'signed out'} via {authEvent.source}
          </p>
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
              <dd>ap-south-1</dd>
            </div>
            <div>
              <dt>Release</dt>
              <dd>2026.04.25</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Ready</dd>
            </div>
          </dl>
        </article>

        <article className="profile-card activity-card">
          <h2>Recent activity</h2>
          <ul>
            {activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
