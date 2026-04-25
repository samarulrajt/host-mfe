declare module 'catalog/CatalogApp' {
  import { ComponentType } from 'react';
  import type { RemoteAppProps } from '../../../shared';
  const CatalogApp: ComponentType<RemoteAppProps>;
  export default CatalogApp;
}

declare module 'profile/ProfileApp' {
  import { ComponentType } from 'react';
  import type { RemoteAppProps } from '../../../shared';
  const ProfileApp: ComponentType<RemoteAppProps>;
  export default ProfileApp;
}
