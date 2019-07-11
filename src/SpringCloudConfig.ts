
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { logger, getSpringApplicationJsonFromEnv, getCustomEnvProperties } from "./utils";
import { ConfigObject, CloudConfigOptions } from './models';
import { mergeProperties, readYamlAsDocument, parsePropertiesToObjects } from './utils';
import { CloudConfigOptionsSchema, BootstrapConfigSchema } from './schemas';
import { SpringCloudConfigServiceImpl } from './services';
import { injectable } from 'inversify';

@injectable()
export class SpringCloudConfig {
	private bootstrapConfig: ConfigObject;
	private Config: ConfigObject | undefined;

	constructor(
		private readonly springCloudConfigServiceImpl: SpringCloudConfigServiceImpl
	) {}

	/**
	 * Reads the application's bootstrap configuration file into an object.
	 *
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {Promise<ConfigObject>} The bootstrap configuration.
	 */
	private async readBootstrapConfig(options: CloudConfigOptions): Promise<ConfigObject> {
		// Load bootstrap.yml based on the profile name (like devEast or stagingEast)
		const theBootstrapPath: string = options.bootstrapPath !== undefined ? options.bootstrapPath : options.configPath;
		let thisBootstrapConfig: ConfigObject = mergeProperties([
			await readYamlAsDocument(`${theBootstrapPath}/bootstrap.yml`, options.activeProfiles),
			getSpringApplicationJsonFromEnv(),
			getCustomEnvProperties()
		]);

		const { error } = BootstrapConfigSchema.validate(thisBootstrapConfig, { allowUnknown: true });
		if (error) {
			throw new Error(error.details[0].message);
		}

		thisBootstrapConfig.spring.cloud.config.profiles = options.activeProfiles;

		return thisBootstrapConfig;
	}

	/**
	 * Read the application's configuration files and merge them into a single object.
	 *
	 * @param {string} appConfigPath Path to where the application yaml files can be found.
	 * @param {string[]} activeProfiles The active profiles to use for filtering config files.
	 * @returns {Promise<ConfigObject>} The merged (local) application configuration files.
	 */
	private async readApplicationConfig(appConfigPath: string, activeProfiles: string[]): Promise<ConfigObject> {
		const applicationConfig: ConfigObject = await readYamlAsDocument(appConfigPath + '/application.yml', activeProfiles);
		const appConfigs: ConfigObject[] = [ applicationConfig ];
		activeProfiles.forEach(function(activeProfile: string) {
			const profileSpecificYaml = 'application-' + activeProfile + '.yml';
			const profileSpecificYamlPath = appConfigPath + '/' + profileSpecificYaml;
			if (fs.existsSync(profileSpecificYamlPath)) {
				const propDoc = yaml.safeLoad(fs.readFileSync(profileSpecificYamlPath, 'utf8'));
				const thisDoc = parsePropertiesToObjects(propDoc);
				appConfigs.push(thisDoc);
			} else {
				logger.debug('Profile-specific yaml not found: ' + profileSpecificYaml);
			}
		});

		return mergeProperties(appConfigs);
	}

	/**
	 * Reads the external configuration from Spring Cloud Config Server, with retry if enabled.
	 *
	 * @param {ConfigObject} theBootstrapConfig The bootstrap properties needed for Spring Cloud Config.
	 * @returns {Promise<ConfigObject>} The Spring Environment Object obtained from the Config Server.
	 */
	private async readCloudConfig(theBootstrapConfig: ConfigObject): Promise<ConfigObject> {
		return await this.springCloudConfigServiceImpl.getConfigFromServer(theBootstrapConfig);
	}

	/**
	 * Reads an application's configuration properties from various sources
	 * and merges them into a single configuration object.
	 *
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	private async readConfig(options: CloudConfigOptions): Promise<ConfigObject> {
		let propertiesObjects: ConfigObject[] = [];

		this.bootstrapConfig = await this.readBootstrapConfig(options);
		logger.debug("Using Bootstrap Config: " + JSON.stringify(this.bootstrapConfig));

		const applicationConfig: ConfigObject =
			await this.readApplicationConfig(options.configPath, options.activeProfiles);
		logger.debug("Using Application Config: " + JSON.stringify(applicationConfig));
		propertiesObjects.push(applicationConfig);

		// Override appliction name in bootstrap config if defined in application config
		if (applicationConfig.spring
				&& applicationConfig.spring.cloud
				&& applicationConfig.spring.cloud.config
				&& applicationConfig.spring.cloud.config.name) {
					this.bootstrapConfig.spring.cloud.config.name = applicationConfig.spring.cloud.config.name;
				}

		const cloudConfig: ConfigObject = await this.readCloudConfig(this.bootstrapConfig);
		propertiesObjects.push(cloudConfig);

		// Bootstrap properties have the highest priority, so pushing this last
		propertiesObjects.push(this.bootstrapConfig);

		// Merge the properties into a single object
		this.Config = mergeProperties(propertiesObjects);

		logger.debug('Using Config: ' + JSON.stringify(this.Config));
		return this.Config;
	}

	/**
	 * Initialize the config instance by reading all property sources.
	 *
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	public async load(options: CloudConfigOptions): Promise<ConfigObject> {
		const { error } = CloudConfigOptionsSchema.validate(options);
		if (error !== null) { // options.bootstrapPath is optional
			throw new Error("Invalid options supplied. Please consult the documentation.");
		}

		logger.level = (options.level !== undefined ? options.level : 'info');

		return this.readConfig(options);
	}

	public instance(): ConfigObject {
		if (this.Config === undefined) {
			throw new Error("SpringCloudConfig hasn't been loaded yet.");
		}

		return this.Config;
	}

}