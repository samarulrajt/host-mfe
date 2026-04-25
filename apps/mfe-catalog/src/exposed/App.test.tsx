// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/dom';
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as shared from '../../../../shared';
import { remoteHostUser, renderRemoteApp } from '../../../test-utils/renderRemoteApp';
import CatalogApp from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('catalog remote UI', () => {
  it('renders host-mounted catalog data for the authenticated user', async () => {
    vi.spyOn(shared, 'getApiMode').mockReturnValue('mock');
    vi.spyOn(shared, 'listCatalogProducts').mockResolvedValue([
      {
        id: 'product-1',
        name: 'Starter plan',
        summary: 'Entry-level package for new teams.',
        price: '$29',
        status: 'available',
      },
    ]);

    renderRemoteApp({
      component: CatalogApp,
      currentUser: remoteHostUser,
      props: {
        onNavigate: () => undefined,
      },
    });

    expect(screen.getByText('Mounted by host')).toBeInTheDocument();
    expect(screen.getByText('Loading catalog products…')).toBeInTheDocument();
    expect(await screen.findByText('Starter plan')).toBeInTheDocument();
    expect(screen.getByText('Signed in as Remote Tester from Test Org.')).toBeInTheDocument();
    expect(screen.getByText('API mode: mocked local data')).toBeInTheDocument();
  });

  it('shows an error state and retries catalog loading successfully', async () => {
    const listCatalogProductsSpy = vi
      .spyOn(shared, 'listCatalogProducts')
      .mockRejectedValueOnce(new Error('Catalog service unavailable'))
      .mockResolvedValueOnce([
        {
          id: 'product-2',
          name: 'Growth plan',
          summary: 'Scaled offering for expanding teams.',
          price: '$99',
          status: 'enterprise',
        },
      ]);

    renderRemoteApp({
      component: CatalogApp,
      currentUser: remoteHostUser,
      props: {
        onNavigate: () => undefined,
      },
    });

    expect(await screen.findByText('Catalog service unavailable')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Growth plan')).toBeInTheDocument();
    expect(screen.queryByText('Catalog service unavailable')).not.toBeInTheDocument();
    expect(listCatalogProductsSpy).toHaveBeenCalledTimes(2);
  });

  it('navigates to profile when the host action is triggered', async () => {
    const onNavigate = vi.fn();

    vi.spyOn(shared, 'listCatalogProducts').mockResolvedValue([]);

    renderRemoteApp({
      component: CatalogApp,
      props: {
        onNavigate,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open profile' }));

    expect(onNavigate).toHaveBeenCalledWith('/profile');
    expect(await screen.findByText('Feature-owned product discovery.')).toBeInTheDocument();
  });
});
