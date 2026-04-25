import type { AuthSource } from '../contracts';

export type AuthChangedDetail = {
  isAuthenticated: boolean;
  userName: string | null;
  source: AuthSource;
};

const AUTH_CHANGED_EVENT = 'auth:changed';

export function emitAuthChanged(detail: AuthChangedDetail) {
  window.dispatchEvent(
    new CustomEvent<AuthChangedDetail>(AUTH_CHANGED_EVENT, {
      detail,
    }),
  );
}

export function subscribeAuthChanged(handler: (detail: AuthChangedDetail) => void) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AuthChangedDetail>;
    handler(customEvent.detail);
  };

  window.addEventListener(AUTH_CHANGED_EVENT, listener);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
  };
}
