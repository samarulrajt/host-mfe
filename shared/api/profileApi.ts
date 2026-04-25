import type { AuthUser, ProfileSummary } from '../contracts';
import { getApiMode, requestJson, wait } from './core';

function buildMockProfileSummary(currentUser?: AuthUser | null): ProfileSummary {
  const displayName = currentUser?.name ?? 'Workspace operator';

  return {
    greeting: `${displayName}, your workspace is healthy.`,
    deployment: {
      region: 'ap-south-1',
      release: '2026.04.26',
      status: 'Ready',
    },
    recentActivity: [
      'Invited 3 new teammates to the workspace and assigned roles',
      'Published a dashboard widget to the host shell catalog',
      'Reviewed the latest remote deployment status and logs within the profile',
    ],
  };
}

export async function getProfileSummary(currentUser?: AuthUser | null) {
  if (getApiMode() === 'mock') {
    await wait(520);
    return buildMockProfileSummary(currentUser);
  }

  return requestJson<ProfileSummary>('/api/profile/summary');
}