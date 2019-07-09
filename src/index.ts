import 'reflect-metadata';
import { SpringCloudConfig } from './SpringCloudConfig';
import Container from './Container';
import { ConfigObject, CloudConfigOptions } from './models';

export * from './models';
export * from './SpringCloudConfig';

export const Config: SpringCloudConfig = Container.get<SpringCloudConfig>(SpringCloudConfig);

// For supporting 'require' syntax, exporting the below as top level functions
export const load = async (cloudConfigOptions: CloudConfigOptions): Promise<ConfigObject> => {
    return await Config.load(cloudConfigOptions);
};

export const instance = (): ConfigObject => {
    return Config.instance();
};