
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as cloudConfigClient from 'cloud-config-client';
import logger from './logger';
import { ConfigObject, CloudConfigOptions } from './models';
import { mergeProperties, readYamlAsDocument, parsePropertiesToObjects } from './utils';

export default class SpringCloudConfig {
	private bootstrapConfig: ConfigObject;
	private config: ConfigObject;

	public constructor() {}

	/**
	 * Initialize the config instance by reading all property sources.
	 * 
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	public async load(options: CloudConfigOptions): Promise<ConfigObject> {
		// options.bootstrapPath is optional
		if (!(options.configPath && options.activeProfiles))
			throw new Error("Invalid options supplied. Please consult the documentation.");
		
		logger.level = (options.level ? options.level : 'info');
	
		return this.readConfig(options);
	};
	
	public instance(): ConfigObject {
		return this.config;
	};

	/**
	 * Reads an application's configuration properties from various sources 
	 * and merges them into a single configuration object.
	 * 
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {ConfigObject} The merged configuration properties from all sources.
	 */
	public async readConfig(options: CloudConfigOptions): Promise<ConfigObject> {
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
				&& applicationConfig.spring.cloud.config.name)
				this.bootstrapConfig.spring.cloud.config.name = applicationConfig.spring.cloud.config.name;
		
		const cloudConfig: ConfigObject = await this.readCloudConfig(this.bootstrapConfig);
		propertiesObjects.push(cloudConfig);

		// Bootstrap properties have the highest priority, so pushing this last
		propertiesObjects.push(this.bootstrapConfig);

		// Merge the properties into a single object
		this.config = mergeProperties(propertiesObjects);

		logger.debug('Using Config: ' + JSON.stringify(this.config));
		return this.config
	}

	/**
	 * Reads the application's bootstrap configuration file into an object.
	 * 
	 * @param {CloudConfigOptions} options The config options that drive behavior here.
	 * @returns {Promise<ConfigObject>} The bootstrap configuration.
	 */
	public async readBootstrapConfig(options: CloudConfigOptions): Promise<ConfigObject> {
		// Load bootstrap.yml based on the profile name (like devEast or stagingEast)
		let theBootstrapPath: string = options.bootstrapPath ? options.bootstrapPath : options.configPath;
		const thisBootstrapConfig: ConfigObject = 
			await readYamlAsDocument(`${theBootstrapPath}/bootstrap.yml`, options.activeProfiles);
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
	public async readApplicationConfig(appConfigPath: string, activeProfiles: string[]): Promise<ConfigObject> {
		const applicationConfig: ConfigObject = await readYamlAsDocument(appConfigPath + '/application.yml', activeProfiles);
		let appConfigs: ConfigObject[] = [ applicationConfig ];
		activeProfiles.forEach(function(activeProfile) {
			const profileSpecificYaml = 'application-' + activeProfile + '.yml';
			const profileSpecificYamlPath = appConfigPath + '/' + profileSpecificYaml;
			if (fs.existsSync(profileSpecificYamlPath)) {
				try {
					const propDoc = yaml.safeLoad(fs.readFileSync(profileSpecificYamlPath, 'utf8'));
					const thisDoc = parsePropertiesToObjects(propDoc);
					appConfigs.push(thisDoc);
				} catch (error) {
					logger.error('Error reading profile-specific yaml: ' + error.message);
				}
			} else {
				logger.debug('Profile-specific yaml not found: ' + profileSpecificYaml);
			}
		});
		
		return mergeProperties(appConfigs);
	}
	
	/**
	 * Reads the external configuration from Spring Cloud Config Server
	 *
	 * @param {ConfigObject} bootStrapConfig The bootstrap properties needed for Spring Cloud Config
	 * @returns {Promise<ConfigObject>} The Spring Environment Object obtained from the Config Server
	 */
	public async readCloudConfig(bootStrapConfig: ConfigObject): Promise<ConfigObject> {
		let cloudConfig = {};
		if (bootStrapConfig.spring.cloud.config.enabled) {
			try {
				logger.debug("Spring Cloud Options: " + JSON.stringify(bootStrapConfig.spring.cloud.config));
				try {
					const cloudConfigProperties: ConfigObject = 
						await cloudConfigClient.load(bootStrapConfig.spring.cloud.config, null);
					if (cloudConfigProperties) {
						cloudConfigProperties.forEach(function(key, value) {
							cloudConfig[key] = value;
						}, false);
						cloudConfig = parsePropertiesToObjects(cloudConfig);
					}
					logger.debug("Cloud Config: " + JSON.stringify(cloudConfig));
					return cloudConfig;
				} catch (error) {
					logger.error("Error reading cloud config: %s", error.message);
					return cloudConfig;
				};
			} catch (e) {
				logger.error("Caught error from cloud config client: %s", e.message);
				return cloudConfig;
			}
		} else {
			return cloudConfig;
		}
	}
}