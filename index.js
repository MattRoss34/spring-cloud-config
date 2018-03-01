const yaml = require('js-yaml');
const fs = require('fs');
const url = require('url');
const cloudConfigClient = require("cloud-config-client");
const logger = require('./logger');
const os = require('os');
const extend = require('extend');

const argv = require("yargs").argv;
const test = argv && argv.test;

var bootstrapConfig; // The config to use for cloud config client
var instance; // The initialized config instance

/**
 * Reads all of the configuration sources for the application and merges them into a single config object.
 *
 * @param {Object} options Object containing the options for configuration.
 * @returns {Promise} Promise will resolve to the fully merged config object
 */
function readConfig(options) {
	return new Promise(function (resolve, reject) {
		var propertiesObjects = [];
		// Load bootstrap.yml based on the profile name (like devEast or stagingEast)
		let theBootstrapPath = options.bootstrapPath ? options.bootstrapPath : options.configPath;
		readYamlAsDocument(theBootstrapPath + '/bootstrap.yml', options.activeProfiles).then((thisBootstrapConfig) => {
			thisBootstrapConfig.profiles = options.activeProfiles;
			logger.debug("Using Bootstrap Config: " + JSON.stringify(thisBootstrapConfig));
			bootstrapConfig = thisBootstrapConfig
			propertiesObjects.push(thisBootstrapConfig);
			
			return readYamlAsDocument(options.configPath + '/application.yml', options.activeProfiles);
		}).then((applicationConfig) => {
			logger.debug("Using Application Config: " + JSON.stringify(applicationConfig));
			propertiesObjects.push(applicationConfig);
			if (applicationConfig.name)
				bootstrapConfig.name = applicationConfig.name;
			
			return readCloudConfig(bootstrapConfig);
		}).then((cloudConfig) => {
			propertiesObjects.push(cloudConfig);
			// Merge the properties into a single object
			instance = mergeProperties(propertiesObjects);

			logger.debug('Using Config: ' + JSON.stringify(instance));
			resolve(instance);
		}).catch(function (error) {
			logger.error(error);
			reject(error);
		});
	});
}

/**
 * Reads the external configuration from Spring Cloud Config Server
 *
 * @param {Object} bootStrapConfig The bootstrap properties needed for Spring Cloud Config
 * @returns {Promise} The Spring Environment Object obtained from the Config Server
 */
function readCloudConfig(bootStrapConfig) {
	return new Promise((resolve, reject) => {
		var cloudConfig = {};
		if (bootStrapConfig.spring.cloud.config.enabled) {
			try {
				logger.debug("Cloud Options: " + JSON.stringify(bootStrapConfig));
				cloudConfigClient.load(bootStrapConfig).then((cloudConfigProperties) => {
					if (cloudConfigProperties) {
						cloudConfigProperties.forEach(function(key, value) {
							cloudConfig[key] = value;
						}, false);
						cloudConfig = parsePropertiesToObjects(cloudConfig);
					}
					logger.debug("Cloud Config: " + JSON.stringify(cloudConfig));
					resolve(cloudConfig);
				}, (error) => {
					logger.error("Error reading cloud config: %s", error.message);
					resolve(cloudConfig);
				});
			} catch (e) {
				logger.error("Caught error from cloud config client: %s", e.message);
				resolve(cloudConfig);
			}
		} else {
			resolve(cloudConfig);
		}
	});
}

/**
 * Reads the yaml document and parses any dot-separated property keys into objects.
 * 
 * @param {string} relativePath Relative path of the file to read.
 * @param {Array} activeProfiles Profiles to filter the yaml documents on.
 */
function readYamlAsDocument(relativePath, activeProfiles) {
	return readYaml(relativePath, activeProfiles).then((yamlDoc) => {
		return Promise.resolve(parsePropertiesToObjects(yamlDoc));
	});
}

/**
 * Reads the yaml file at the given relative path and merges multiple docs into a single object.
 * If 'profile' is specified then this method expects to filter the yaml for docs based on doc.profiles.
 * If no profile is specified, then only docs without an 'env' property will be read from the yaml.
 *
 * @param {string} relativePath Relative path of the file to read.
 * @param {Array} activeProfiles Profiles to filter the yaml documents on.
 * @returns {Promise} Object representation of the given yaml file.
 */
function readYaml(relativePath, activeProfiles) {
	return new Promise(function(resolve, reject) {
		try {
			var doc = {};
			logger.debug('loading config file from: ' + relativePath);
			yaml.safeLoadAll(fs.readFileSync(relativePath, 'utf8'), (thisDoc) => {
				if (shouldUseDocument(thisDoc, activeProfiles))
					extend(true, doc, thisDoc);
			});

			resolve(doc);
		} catch (e) {
			logger.error(e);
			reject(e);
		}
	});
}

/**
 * Determines if the given yaml document should be used with regard to the
 * given profile. This provides similar functionality to spring profiles.
 *
 * @param {Object} document The yaml doc to check.
 * @param {Array} activeProfiles The current profile names to filter docs by.
 * @returns {boolean} True if the given yaml doc applies to the given profiles.
 */
function shouldUseDocument(document, activeProfiles) {
	let useThisDoc = false;
	if (document && !document.profiles)
		useThisDoc = true; // This document applies to all profiles
	else if (document && activeProfiles) {
		let documentProfiles = document.profiles.split(",");
		for (let i=0; i < documentProfiles.length; i++) {
			if (documentProfiles[i]) {
				if (documentProfiles[i][0] === "!") {
					let excludeProfile = documentProfiles[i].substring(1);
					if (activeProfiles.indexOf(excludeProfile) >= 0)
						return false; // This document should not be used
				} else if (activeProfiles.indexOf(documentProfiles[i]) >= 0)
					useThisDoc = true; // This document applies to the profiles
			}
		}
	}
	return useThisDoc;
}

/**
 * Takes an array of objects and merges their properties in order, from index 0 to length-1.
 * Identical properties in later objects will override those in previous objects.
 * This method does handle deeply nested property keys (like: {'spring': 'profiles': 'active': 'local'})
 *
 * @param {Object[]} objects Array of Objects containing properties to be merged
 * @returns {Object} Object containing the merged properties
 */
function mergeProperties(objects) {
	var mergedConfig = {};
	for (var i = 0; i < objects.length; i++) {
		extend(true, mergedConfig, objects[i]);
	}
	return mergedConfig;
}

/**
 * Parses the dot-separated key-value pairs of an object into deeply nested Objects.
 * Example: 'spring.profiles.active': 'dev' -> 'spring': 'profiles': 'active': 'dev'
 *
 * @param {Object} propertiesObject Object containing properties to be parsed
 * @returns {Object} Object of deeply nested properties (not dot-separated)
 */
function parsePropertiesToObjects(propertiesObject) {
	var object = {};
	if (propertiesObject) {
		for (var thisPropertyName in propertiesObject) {
			var thisPropertyObject = createObjectForProperty(thisPropertyName.split('.'), propertiesObject[thisPropertyName]);
			extend(true, object, thisPropertyObject);
		}
	}
	return object;
}

/**
 * Turns an array of key segments and value into a nested object.
 * Example: ['spring','profiles','active'], 'dev' -> { 'spring': 'profiles': 'active': 'dev' }
 *
 * @param {string[]} propertyKeys The key segments for the given property
 * @param propertyValue The value associated with the given property
 * @returns {Object}
 */
function createObjectForProperty(propertyKeys, propertyValue) {
	if (propertyKeys.length === 0)
		return propertyValue;

	const thisPropertyName = propertyKeys.shift();
	const thisPropertyValue = createObjectForProperty(propertyKeys, propertyValue);
	var thisObject = {};
	thisObject[thisPropertyName] = thisPropertyValue;

	return thisObject;
}

/**
 * Initialize the config instance by reading all property sources.
 * 
 * @param {Object} options The options to use for initialization.
 */
module.exports.load = function(options) {
	// options.bootstrapPath is optional
	if (!(options.configPath && options.activeProfiles))
		return Promise.reject("Invalid options supplied. Please consult the documentation.");
	
	logger.level = (options.level ? options.level : 'info');

	return readConfig(options);
};

module.exports.instance = function() {
	return instance;
};

// To enable unit testing
module.exports.readCloudConfig = readCloudConfig;
module.exports.readYaml = readYaml;
module.exports.shouldUseDocument = shouldUseDocument;
module.exports.mergeProperties = mergeProperties;
module.exports.parsePropertiesToObjects = parsePropertiesToObjects;
module.exports.createObjectForProperty = createObjectForProperty;
