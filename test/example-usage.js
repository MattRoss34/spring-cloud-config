const springCloudConfig = require('../index');
const configOptions = {
    configPath: __dirname + '/config',
    activeProfiles: ['dev']
};
const myConfig = springCloudConfig.load(configOptions);