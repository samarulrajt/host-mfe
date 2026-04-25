export type ToastDetail = {
  message: string;
  source: 'host' | 'catalog' | 'profile';
  tone?: 'info' | 'success';
};

const TOAST_SHOW_EVENT = 'toast:show';

export function emitToastShow(detail: ToastDetail) {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_SHOW_EVENT, {
      detail,
    }),
  );
}

export function subscribeToastShow(handler: (detail: ToastDetail) => void) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ToastDetail>;
    handler(customEvent.detail);
  };

  window.addEventListener(TOAST_SHOW_EVENT, listener);

  return () => {
    window.removeEventListener(TOAST_SHOW_EVENT, listener);
  };
}
