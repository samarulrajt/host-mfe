export type CatalogProduct = {
  id: string;
  name: string;
  price: string;
  summary: string;
  status: 'available' | 'beta' | 'enterprise';
};