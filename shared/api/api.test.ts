import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthSession } from './authApi';
import { listCatalogProducts } from './catalogApi';
import { getApiBaseUrl, getApiMode } from './core';
import { getProfileSummary } from './profileApi';

const env = import.meta.env as Record<string, string | undefined>;
const originalFetch = globalThis.fetch;
const originalApiMode = env.VITE_API_MODE;
const originalApiBaseUrl = env.VITE_API_BASE_URL;

describe('shared api layer', () => {
  beforeEach(() => {
    env.VITE_API_MODE = undefined;
    env.VITE_API_BASE_URL = undefined;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    env.VITE_API_MODE = originalApiMode;
    env.VITE_API_BASE_URL = originalApiBaseUrl;
    globalThis.fetch = originalFetch;
  });

  it('defaults to mock api mode when no env is configured', () => {
    expect(getApiMode()).toBe('mock');
  });

  it('uses remote api mode when configured', () => {
    env.VITE_API_MODE = 'remote';

    expect(getApiMode()).toBe('remote');
  });

  it('normalizes the api base url', () => {
    env.VITE_API_BASE_URL = 'https://example.test/';

    expect(getApiBaseUrl()).toBe('https://example.test');
  });

  it('returns mock catalog products in mock mode', async () => {
    const products = await listCatalogProducts();

    expect(products).toHaveLength(3);
    expect(products[0]).toMatchObject({
      id: 'starter-analytics-kit',
      status: 'available',
    });
  });

  it('fetches remote catalog products in remote mode', async () => {
    env.VITE_API_MODE = 'remote';
    env.VITE_API_BASE_URL = 'https://api.example.test';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'remote-product', name: 'Remote product', price: '$1', summary: 'Fetched remotely', status: 'available' }],
    });

    globalThis.fetch = fetchMock as typeof fetch;

    const products = await listCatalogProducts();

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/catalog/products', {
      headers: { Accept: 'application/json' },
    });
    expect(products[0]?.id).toBe('remote-product');
  });

  it('returns a personalized mock profile summary in mock mode', async () => {
    const summary = await getProfileSummary({
      id: 'user-1',
      name: 'Test User',
      roles: ['admin'],
      organization: 'Test Org',
    });

    expect(summary.greeting).toContain('Test User');
    expect(summary.recentActivity).toHaveLength(3);
  });

  it('fetches remote profile summary in remote mode', async () => {
    env.VITE_API_MODE = 'remote';
    env.VITE_API_BASE_URL = 'https://api.example.test';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        greeting: 'Remote summary',
        deployment: { region: 'us-east-1', release: '2026.04.26', status: 'Ready' },
        recentActivity: ['Remote activity'],
      }),
    });

    globalThis.fetch = fetchMock as typeof fetch;

    const summary = await getProfileSummary();

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/profile/summary', {
      headers: { Accept: 'application/json' },
    });
    expect(summary.greeting).toBe('Remote summary');
  });

  it('returns the expected host auth session in mock mode', async () => {
    const session = await getAuthSession('host');

    expect(session.source).toBe('host');
    expect(session.currentUser?.organization).toBe('Host MFE Labs');
    expect(session.isAuthenticated).toBe(true);
  });

  it('returns the expected standalone auth session targets in mock mode', async () => {
    const catalogSession = await getAuthSession('catalog-standalone');
    const profileSession = await getAuthSession('profile-standalone');

    expect(catalogSession.source).toBe('standalone');
    expect(catalogSession.currentUser?.organization).toBe('Catalog Sandbox');
    expect(profileSession.source).toBe('standalone');
    expect(profileSession.currentUser?.organization).toBe('Profile Sandbox');
  });

  it('fetches remote auth session in remote mode', async () => {
    env.VITE_API_MODE = 'remote';
    env.VITE_API_BASE_URL = 'https://api.example.test';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        currentUser: null,
        isAuthenticated: false,
        source: 'remote',
      }),
    });

    globalThis.fetch = fetchMock as typeof fetch;

    const session = await getAuthSession('host');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/auth/session', {
      headers: { Accept: 'application/json' },
    });
    expect(session).toMatchObject({
      isAuthenticated: false,
      source: 'remote',
    });
  });
});