# Spring-like Cloud Config for NodeJS Applications

NodeJS application configuration using similar style to Spring Config and using the Spring Cloud Config Server for remote property sources.

Depends on [cloud-config-client](https://www.npmjs.com/package/cloud-config-client) for the config server client functionality.

## Introduction

You get to define your application properties the same way you do in your Spring Boot applications. Use a `bootstrap.yml` file to specify your config server settings and `application.yml` to hold your local application properties. This module even supports profiling, similar to Spring Boot profiles.

## Getting Started

Install the package
```bash
npm install spring-cloud-config
```

Define an application.yml in the location of your choice.
#### application.yml
```yaml
db:
    mongo:
        url: http://localhost:27017
---
profiles: dev
db:
    mongo:
        url: http://dev-mongo-server:27017
```

Define a bootstrap.yml in the location of your choice.
#### bootstrap.yml
```yaml
spring.cloud.config.enabled: true
name: my-application-name
endpoint: http://localhost:8888
label: master
---
profiles: dev
endpoint: http://dev-config-server:8888
```

Consume the module in your script.
```javascript
const springCloudConfig = require('spring-cloud-config');
let configOptions = {
    configPath: __dirname + '/config',
    activeProfiles: ['dev'],
    level: 'debug'
};
let myConfig = springCloudConfig.load(configOptions);
// Now let's use the config properties
let myMongoUrl = myConfig.db.mongo.url;
```

## Things Explained

### The Yaml Files

This module requires that you supply a folder path where it can expect to find two files: `bootstrap.yml` and `application.yml`. The bootstrap yaml is used to configure your cloud config server properties, similar to Spring Cloud Config. The application yaml should be used for defining your application's configuration properties.

### Support for Profiles

As with any Yaml implementation, you can include multiple documents in each Yaml file using `---` as a separator. Additionally, this module allows you to define documents that apply to specific 'profiles', same as the 'spring.profiles' concept. If you include a `profiles` property in a given yaml document, those properties will only be included in your merged configuration result if any of the given profiles are found in the `options.activeProfiles` array.

### Remote Property Sources

If you enable the use of spring cloud config (via `spring.cloud.config.enabled: true`), the properties in `application.yml` will be overridden by any of the same properties defined in your remote sources. Keep in mind, however, any error encountered while reaching the remote property sources is currently ignored. Because of this, it is recommended that the properties defined in application.yml be kept up to date and represent the most current state of the application (as much as reasonably possible).

## API
### `load` function

Reads all defined property sources, including remote cloud config properties (if enabled), and returns the merged configuration properties object.

Parameter | Type | Description
--------- | ---- | -----------
options | Object | Holds the options properties that help you configure the behavior of this module.
options.configPath | String | The folder path to your yaml config files.
options.activeProfiles | String[] | Profile names to filter your local yaml documents, as well as your remote property sources, by.
options.level | String | Logging level to use.

### `instance` function

Returns the current configuration properties object. Use the `load` function prior to using this.

### `bootstrap.yml` Cloud Config Options
Option | Type | Description
------ | -------- | -----------
spring.cloud.config.enabled | boolean | Enable/disable the usage of remote properties via a Spring Cloud Config Server.
Properties Inherited from [cloud-config-client](https://www.npmjs.com/package/cloud-config-client) | | 
name | String | The application name to be used for reading remote properties.
endpoint | String | The url endpoint of the Spring Cloud Config Server.
label | String | The cloud config label to use.
rejectUnauthorized | boolean | default = true: if false accepts self-signed certificates
auth | Object | optional: Basic Authentication for config server (e.g.: { user: "username", pass: "password"}). endpoint accepts also basic auth (e.g. http://user:pass@localhost:8888).
auth.user | string | mandatory username if using auth
auth.pass | string | mandatory password if using auth

## `application.yml` Application Config Properties
Option | Type | Description
------ | -------- | -----------
any.property.you.need | ? | This is your playground where you define whatever properties your application needs to function.