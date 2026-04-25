import type { CatalogProduct } from '../contracts';
import { getApiMode, requestJson, wait } from './core';

const mockCatalogProducts: CatalogProduct[] = [
  {
    id: 'starter-analytics-kit',
    name: 'Starter analytics kit for React',
    price: '$29',
    summary: 'Prebuilt charts and dashboards you can plug into the shell.',
    status: 'available',
  },
  {
    id: 'team-workspace-pack',
    name: 'Team workspace pack',
    price: '$79',
    summary: 'Shared navigation patterns and reusable collaboration widgets.',
    status: 'beta',
  },
  {
    id: 'enterprise-federation-bundle',
    name: 'Enterprise federation bundle',
    price: '$149',
    summary: 'A larger feature slice built to prove remote composition at scale.',
    status: 'enterprise',
  },
];

export async function listCatalogProducts() {
  if (getApiMode() === 'mock') {
    await wait(420);
    return mockCatalogProducts;
  }

  return requestJson<CatalogProduct[]>('/api/catalog/products');
}