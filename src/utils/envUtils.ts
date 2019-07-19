import { ConfigObject } from '../models';
import { logger } from './logger';
import { parsePropertiesToObjects } from './documentUtils';

/**
 * Retrieves the properties defined by the APPLICATION_JSON env variable, if defined.
 *
 * @returns {ConfigObject} The Spring Application JSON from ENV as an Object.
 */
export const getSpringApplicationJsonFromEnv = (): ConfigObject => {
    let springApplicationJson: ConfigObject = {};
    if (process.env.APPLICATION_JSON !== undefined) {
        springApplicationJson = JSON.parse(process.env.APPLICATION_JSON);
        logger.debug(`Spring Application JSON from Env: ${JSON.stringify(springApplicationJson)}`);
    }

    return springApplicationJson;
};

/**
 * Retrieves a set of variables from node env and maps them to config properties.
 * The input mappings define which env variables map to which configuration properties.
 *
 * @returns {ConfigObject} The env variables mapped to a config properties object.
 */
export const getPropertiesFromEnv = (envVariableMappings: { [ key: string ]: string }): ConfigObject => {
    let mappedProperties: ConfigObject = {};
    Object.entries(envVariableMappings).forEach(([envVariable, propertyMapping]) => {
        if (process.env[envVariable] !== undefined) {
            mappedProperties[propertyMapping] = process.env[envVariable];
        }
    });

    return parsePropertiesToObjects(mappedProperties);
}