// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/dom';
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as shared from '../../../../shared';
import { remoteHostUser, renderRemoteApp } from '../../../test-utils/renderRemoteApp';
import ProfileApp from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('profile remote UI', () => {
  it('renders profile summary data for the authenticated user', async () => {
    vi.spyOn(shared, 'getApiMode').mockReturnValue('mock');
    vi.spyOn(shared, 'getProfileSummary').mockResolvedValue({
      greeting: 'Remote Tester, your workspace is healthy.',
      deployment: {
        region: 'us-east-1',
        release: '2026.04.26',
        status: 'Healthy',
      },
      recentActivity: ['Reviewed usage metrics', 'Updated teammate access'],
    });

    renderRemoteApp({
      component: ProfileApp,
      currentUser: remoteHostUser,
      props: {
        onNavigate: () => undefined,
        onSignOut: () => undefined,
      },
    });

    expect(screen.getByText('Mounted by host')).toBeInTheDocument();
    expect(screen.getByText('Loading profile summary…')).toBeInTheDocument();
    expect(await screen.findByText('Remote Tester, your workspace is healthy.')).toBeInTheDocument();
    expect(screen.getByText('Reviewed usage metrics')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('shows an error state and retries profile loading successfully', async () => {
    const getProfileSummarySpy = vi
      .spyOn(shared, 'getProfileSummary')
      .mockRejectedValueOnce(new Error('Profile summary unavailable'))
      .mockResolvedValueOnce({
        greeting: 'Remote Tester, your workspace is healthy.',
        deployment: {
          region: 'us-east-1',
          release: '2026.04.26',
          status: 'Healthy',
        },
        recentActivity: ['Restored profile access'],
      });

    renderRemoteApp({
      component: ProfileApp,
      currentUser: remoteHostUser,
      props: {
        onNavigate: () => undefined,
        onSignOut: () => undefined,
      },
    });

    expect(await screen.findByText('Profile summary unavailable')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry summary' }));

    expect(await screen.findByText('Restored profile access')).toBeInTheDocument();
    expect(screen.queryByText('Profile summary unavailable')).not.toBeInTheDocument();
    expect(getProfileSummarySpy).toHaveBeenCalledTimes(2);
  });

  it('triggers host navigation and sign out actions', async () => {
    const onNavigate = vi.fn();
    const onSignOut = vi.fn();

    vi.spyOn(shared, 'getProfileSummary').mockResolvedValue({
      greeting: 'Remote Tester, your workspace is healthy.',
      deployment: {
        region: 'us-east-1',
        release: '2026.04.26',
        status: 'Healthy',
      },
      recentActivity: [],
    });

    renderRemoteApp({
      component: ProfileApp,
      signOut: onSignOut,
      props: {
        onNavigate,
        onSignOut: () => undefined,
      },
    });

    await screen.findByText('Remote Tester, your workspace is healthy.');

    fireEvent.click(screen.getByRole('button', { name: 'Go to catalog' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(onNavigate).toHaveBeenCalledWith('/catalog');
    expect(onSignOut).toHaveBeenCalled();
  });
});
