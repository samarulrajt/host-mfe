export type DeploymentSnapshot = {
  region: string;
  release: string;
  status: string;
};

export type ProfileSummary = {
  greeting: string;
  deployment: DeploymentSnapshot;
  recentActivity: string[];
};