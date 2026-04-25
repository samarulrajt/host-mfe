export type ThemeMode = 'dark' | 'light';

const THEME_CHANGED_EVENT = 'theme:changed';

export function emitThemeChanged(theme: ThemeMode) {
  window.dispatchEvent(
    new CustomEvent<ThemeMode>(THEME_CHANGED_EVENT, {
      detail: theme,
    }),
  );
}

export function subscribeThemeChanged(handler: (theme: ThemeMode) => void) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ThemeMode>;
    handler(customEvent.detail);
  };

  window.addEventListener(THEME_CHANGED_EVENT, listener);

  return () => {
    window.removeEventListener(THEME_CHANGED_EVENT, listener);
  };
}
