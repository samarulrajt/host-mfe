// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/dom';
import { act, cleanup, render } from '@testing-library/react';
import { lazy } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitToastShow } from '../../../shared';
import { hostUser, renderHostApp } from '../test-utils/renderHostApp';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('host shell UI', () => {
  it('renders remote API mode details in the shell panels', () => {
    renderHostApp({ currentUser: hostUser, apiMode: 'remote' });

    expect(screen.getAllByText('Remote backend').length).toBeGreaterThan(0);
    expect(screen.getByText('This session is calling a real backend configured through Vite environment variables.')).toBeInTheDocument();
    expect(screen.getByText('Set in .env.local for each remote')).toBeInTheDocument();
    expect(screen.getByText('host')).toBeInTheDocument();
  });

  it('renders the overview shell with developer settings', () => {
    renderHostApp({ currentUser: hostUser });

    expect(screen.getByText('Workspace navigation')).toBeInTheDocument();
    expect(screen.getByText('Developer settings')).toBeInTheDocument();
    expect(screen.getByText('Signed in user')).toBeInTheDocument();
    expect(screen.getByText('Host Tester')).toBeInTheDocument();
    expect(screen.getAllByText('Mocked local data').length).toBeGreaterThan(0);
    expect(screen.getByText('One repo, one launch command, separate host and MFEs.')).toBeInTheDocument();
  });

  it('shows shared toast events in the host shell', async () => {
    renderHostApp();

    await act(async () => {
      emitToastShow({
        message: 'Profile saved successfully',
        source: 'profile',
        tone: 'success',
      });
    });

    expect(await screen.findByText('Profile saved successfully')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
  });

  it('shows the loading fallback while a remote is still loading', () => {
    const PendingCatalog = lazy(() => new Promise<never>(() => undefined));

    renderHostApp({ route: '/catalog', catalogComponent: PendingCatalog });

    expect(screen.getByText('Loading micro frontend…')).toBeInTheDocument();
  });

  it('shows the remote error boundary when a remote throws during render', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const ThrowingCatalog = () => {
      throw new Error('Catalog exploded');
    };

    renderHostApp({ route: '/catalog', catalogComponent: ThrowingCatalog });

    expect(await screen.findByText('Unable to render this micro frontend.')).toBeInTheDocument();
    expect(screen.getByText('Catalog exploded')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});