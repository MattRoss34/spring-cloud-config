
import * as path from 'path';

export const DEFAULT_CONFIG_DIR = path.resolve(__dirname, 'config');

export const ENV_LOAD_OPTIONS: { [ key: string ]: string } = {
    'SPRING_CONFIG_PROFILES': 'activeProfiles',
    'SPRING_CONFIG_LOG_LEVEL': 'level'
};

export const ENV_BOOTSTRAP_PROPERTIES: { [ key: string ]: string } = {
    'SPRING_CONFIG_ENDPOINT': 'spring.cloud.config.endpoint',
    'SPRING_CONFIG_AUTH_USER': 'spring.cloud.config.auth.user',
    'SPRING_CONFIG_AUTH_PASS': 'spring.cloud.config.auth.pass'
};