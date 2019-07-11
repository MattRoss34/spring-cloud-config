import { ConfigObject } from '../models';
import { logger } from './logger';
import { CUSTOM_ENV_VARIABLES } from '../constants';
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
 * Retrieves a predefined set of variables from node env and maps them to config properties.
 *
 * @returns {ConfigObject} The env variables mapped to a config properties object.
 */
export const getCustomEnvProperties = (): ConfigObject => {
    let customEnvProperties: ConfigObject = {};
    Object.entries(CUSTOM_ENV_VARIABLES).forEach(([customEnvVariable, propertyMapping]) => {
        if (process.env[customEnvVariable] !== undefined) {
            customEnvProperties[propertyMapping] = process.env[customEnvVariable];
        }
    });

    customEnvProperties = parsePropertiesToObjects(customEnvProperties);

    logger.debug(`Custom Properties from Env: ${JSON.stringify(customEnvProperties)}`);

    return customEnvProperties;
};