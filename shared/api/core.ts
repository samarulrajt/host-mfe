export type ApiMode = 'mock' | 'remote';

export function wait(durationMs: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, durationMs));
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
}

export function getApiMode(): ApiMode {
  const configuredMode = import.meta.env.VITE_API_MODE?.toLowerCase();
  return configuredMode === 'remote' ? 'remote' : 'mock';
}

export async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${path}.`);
  }

  return (await response.json()) as T;
}