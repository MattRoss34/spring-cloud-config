import { SpringCloudConfig } from './SpringCloudConfig';
import Container from './Container';

export * from './models';

const springCloudConfig: SpringCloudConfig = Container.get<SpringCloudConfig>(SpringCloudConfig);

export const load = springCloudConfig.load;
export const instance = springCloudConfig.instance;