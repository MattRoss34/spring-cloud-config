
import * as CloudConfigClient from 'cloud-config-client';
import { ConfigClientOptions, ConfigObject } from '../models';
import { injectable } from 'inversify';
import { parsePropertiesToObjects } from '../utils';

@injectable()
export class SpringCloudConfigGatewayImpl {

	/**
	 * Gets the external configuration from Spring Cloud Config Server.
	 *
	 * @param {ConfigClientOptions} configClientOptions The options to be used for the cloud config client.
	 * @returns {Promise<ConfigObject>} The Spring Environment Object obtained from the Config Server.
	 */
	public async getConfigFromServer(configClientOptions: ConfigClientOptions): Promise<ConfigObject> {
		let cloudConfig: ConfigObject = {};
		const cloudConfigProperties: ConfigObject | undefined = await CloudConfigClient.load(configClientOptions, null);
		if (cloudConfigProperties) {
			// tslint:disable-next-line: no-any
			cloudConfigProperties.forEach(function(key: string, value: any) {
				cloudConfig[key] = value;
			}, false);
			cloudConfig = parsePropertiesToObjects(cloudConfig);
		}

		return cloudConfig;
	}

}