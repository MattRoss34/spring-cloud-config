# Spring-like Cloud Config for NodeJS Applications

[![NPM Version](https://img.shields.io/npm/v/spring-cloud-config.svg?style=flat)](https://www.npmjs.com/package/spring-cloud-config)
[![Build Status](https://travis-ci.org/MattRoss34/spring-cloud-config.svg?branch=master)](https://travis-ci.org/MattRoss34/spring-cloud-config)
[![Coverage Status](https://coveralls.io/repos/github/MattRoss34/spring-cloud-config/badge.svg)](https://coveralls.io/github/MattRoss34/spring-cloud-config)

NodeJS application configuration using similar style to Spring Config and using the Spring Cloud Config Server for remote property sources.

Depends on [cloud-config-client](https://www.npmjs.com/package/cloud-config-client) for the config server client functionality.

Feature requests are welcome.

## Introduction

You get to define your application properties the same way you do in your Spring Boot applications. Use a `bootstrap.yml` file to specify your config server settings and `application.yml` to hold your local application properties. This module even supports profiling, similar to Spring Boot profiles, giving you the option to define profile-based properties in either separate files, like `application-{profile}.yml`, or in a single multi-document yaml file using a `profiles` property on the applicable documents, like `profiles: profile1,profile2`.

## Getting Started

Install the package
```bash
npm install spring-cloud-config
```

Define an application.yml, or a group of application.yml and application-{profile}.yml files, in the location of your choice.
#### application.yml
```yaml
spring.cloud.config.name: my-application-name
db:
   mongo:
      url: http://localhost:27017
---
profiles: dev1,dev2
db:
   mongo:
      url: http://dev-mongo-server:27017
```

Define a bootstrap.yml in the location of your choice.
#### bootstrap.yml
```yaml
spring:
   cloud:
      config:
         enabled: true
         endpoint: http://localhost:8888
         label: master
---
profiles: dev1,dev2
spring.cloud.config.endpoint: http://dev-config-server:8888
```

Load your configuration during startup/initialization.
```javascript
const SpringCloudConfig = require('spring-cloud-config');

const configOptions = {
    configPath: __dirname + '/config',
    activeProfiles: ['dev1'],
    level: 'debug'
};
let myConfig;

SpringCloudConfig.load(configOptions).then(theConfig => {
   myConfig = theConfig;
   // now run your application with the loaded config props.
   // do this by saving the returned config object somewhere,
   // or by using the SpringCloudConfig.instance() helper.
);
```

Use the config later on in your code.
```javascript
const SpringCloudConfig = require('spring-cloud-config');

const myConfig = SpringCloudConfig.instance();
console.log(`My Mongo DB URL: ${myConfig.db.mongo.url}`);
```

Using typescript? No problem...
```javascript
import { Config, CloudConfigOptions, ConfigObject } from 'spring-cloud-config';

const cloudConfigOptions: CloudConfigOptions = {
    configPath: __dirname + '/config',
    activeProfiles: ['dev1'],
    level: 'debug'
};

let myConfig: ConfigObject;

Config.load(cloudConfigOptions).then((theConfig: ConfigObject) => {
   myConfig = theConfig;
   // now run your application with the loaded config props.
   // do this by saving the returned config object somewhere,
   // or by using the Config.instance() helper.
);
```

Now you can use the config properties later on.
```javascript
import { Config } from 'spring-cloud-config';

console.log(`My Mongo DB URL: ${Config.instance().db.mongo.url}`);
```

## Things Explained

### The Yaml Files

As mentioned above, this module uses Yaml files to configure your application properties. You need to supply folder paths where it can expect to find two sets of files: `bootstrap.yml` and `application.yml`. The bootstrap yaml is used to configure your cloud config server properties, similar to Spring Cloud Config. The application yaml should be used for defining your application's configuration properties. Optionally, you can specify your application's name in application.yml instead of in bootstrap.yml, using the `spring.cloud.config.name` property. Doing so gives you the option of using a shared bootstrap.yml (i.e. shared with other apps) but still be able to specify your individual application's name.

### Support for Profiles in Multi-Document Yaml

As with any Yaml implementation you can include multiple documents in a single Yaml file, using `---` as a separator. Additionally, this module allows you to define documents that apply to specific 'profiles', same as the 'spring.profiles' concept. If you include a `profiles` property in a given yaml document, the properties in that document will only be included in your merged configuration result if any of the `configOptions.activeProfiles` match up with the specified profiles.

#### Example application.yml
```yaml
spring.cloud.config.name: my-application-name
db:
   mongo:
      url: http://localhost:27017
---
profiles: dev1,dev2,!local
db:
   mongo:
      url: http://dev-mongo-server:27017
```

#### Applying Yaml Docs to Multiple Profiles

You can apply the properties of a Yaml doc to multiple application profiles. Just provide a comma separated string of profile names in the doc's `profiles` property, like `profiles: dev1,dev2`.

#### Excluding Yaml Docs from Profiles

This module supports the `Not` operator (!) on profiles to provide for excluding configuration properties from specific profiles. Just prepend an '!' to the profile name you want to exclude the given yaml doc from, like `profiles: dev1,!dev2`.

### Support for Profile-Specific File Names

If your application supports a wide range of profiles and/or properties then you might consider using profile-specific file names for your application.yml. Wherever you keep your application.yml, just add more yaml files named with this pattern: `application-{profile}.yml`.

#### Examples
```text
application.yml
application-local.yml
application-dev.yml
application-dev2.yml
application-prod.yml
```

### Node Env Property Sources

This module provides some pre-defined properties/property sources from the Node env. This enables you to exclude sensitive data from your repository files and instead provide them using environment variables.  For example, you might want to exclude the username and password used for authenticating with your remote config server from your git repo.

When set, node env variables will be mapped to their respective config properties during the bootstrap phase. Be aware, env variables take highest precedence so they'll override whatever value is provided from other sources.

#### Pre-Defined Env Variable Mappings

| Env Variable Name | Type | Usage |
| --- | --- | --- |
| SPRING_CONFIG_ENDPOINT | string | Maps to `spring.cloud.config.endpoint`.<p>Example: `SPRING_CONFIG_ENDPOINT=http://test:8888 node index.js` |
| SPRING_CONFIG_AUTH_USER | string | Maps to `spring.cloud.config.auth.user`.<p>Example: `SPRING_CONFIG_AUTH_USER=user1 node index.js` |
| SPRING_CONFIG_AUTH_PASS | string | Maps to `spring.cloud.config.auth.pass`.<p>Example: `SPRING_CONFIG_AUTH_PASS=user1password node index.js` |
| APPLICATION_JSON | Stringified JSON Object | When `APPLICATION_JSON` is set in Node env, the value will be read into the application's configuration as a high priority set of properties.<p>Example: `APPLICATION_JSON='{ "testProp": "testValue" }' node index.js` |

### Remote Property Sources

If you enable the use of spring cloud config via the bootstrap property `spring.cloud.config.enabled: true`, the properties in `application.yml` will be overridden by any of the same properties defined in your remote sources. Keep in mind, however, any error encountered while reaching the remote property sources will be ignored, unless you set the bootstrap property `spring.cloud.config.fail-fast: true`. As a best practice, it is recommended that the properties defined in application.yml be kept up to date and represent the most current state of the application (as much as reasonably possible).

#### Cloud Config Client Fail Fast

If you need spring-cloud-config to throw an error when it can't reach the cloud config server, set the bootstrap property `spring.cloud.config.fail-fast: true`. Combine this with enabling retry (see below) to provide some resiliency to your cloud configuration retrieval.

#### Cloud Config Client Retry

If you'd like spring-cloud-config to retry connecting to your cloud config server after a failure, set the bootstrap property `spring.cloud.config.retry.enabled: true`, in addition to setting `fail-fast` to true (see above). When retry is enabled, spring-cloud-config will retry the config server connection based on the retry configuration you provide, or based on the default configuration.  Below are the retry properties and their defaults. See the API specs further down for details.

- `spring.cloud.config.retry.enabled`: false
- `spring.cloud.config.retry.max-attempts`: 6
- `spring.cloud.config.retry.max-interval`: 1500 (ms)
- `spring.cloud.config.retry.initial-interval`: 1000 (ms)
- `spring.cloud.config.retry.multiplier`: 1.1

## API
### `load` function

Reads all defined property sources, including remote cloud config properties (if enabled), and returns the merged configuration properties object.

Parameter | Type | Description
--------- | ---- | -----------
options | Object | (Required) Holds the options properties that help you configure the behavior of this module.
options.bootstrapPath | String | (Optional) The folder path to your bootstrap config file. If not provided, then options.configPath location must contain both bootstrap.yml and application.yml.
options.configPath | String | (Required) The folder path to your yaml config file(s).
options.activeProfiles | String[] | (Required) Profile names to filter your local yaml documents, as well as your remote property sources, by.
options.level | String | (Optional) Logging level to use.

### `instance` function

Returns the current configuration properties object. Use the `load` function prior to using this.

### `bootstrap.yml` Cloud Config Options
Option | Type | Description
------ | -------- | -----------
spring.cloud.config | object | (Required) The config options to use for fetching remote properties from a Spring Cloud Config Server.
spring.cloud.config.enabled | boolean | (Required) Enable/disable the usage of remote properties via a Spring Cloud Config Server.
spring.cloud.config.fail-fast | boolean | (Optional, Default: false) Enable/disable throwing an error when remote config retrieval fails.
spring.cloud.config.retry | object | (Optional) Controls the retry logic for remote configuration retrieval.
spring.cloud.config.retry.enabled | boolean | (Optional, Default: false) Enable/disable retry. If enabled, retrieval of remote configuration properties will be retried if it fails. See additional properties below.
spring.cloud.config.retry.max-attempts | number | (Optional, Default: 6) Maximum times to retry.
spring.cloud.config.retry.max-interval | number | (Optional, Default: 1500) Maximum interval in milliseconds to wait between retries.
spring.cloud.config.retry.initial-interval | number | (Optional, Default: 1000) Initial interval in milliseconds to wait before the first retry.
spring.cloud.config.retry.multiplier | number | (Optional, Default: 1.1) Factor by which the retry interval will increase between retries.
profiles | string | (Optional) Comma separated string of profiles. Indicates which profiles the properties in the current yaml document apply to.
spring.cloud.config.name | String | (Optional) The application name to be used for reading remote properties. Alternatively, if not provided here, this must be specified in your application.yml.
spring.cloud.config.endpoint | String | (Optional, Default: http://localhost:8888) The url endpoint of the Spring Cloud Config Server.
spring.cloud.config.label | String | (Optional, Default: master) The cloud config label to use.
spring.cloud.config.rejectUnauthorized | boolean | (Optional, Default: true) if false accepts self-signed certificates
spring.cloud.config.auth | Object | (Optional) Basic Authentication for config server (e.g.: { user: "username", pass: "password"}). endpoint accepts also basic auth (e.g. http://user:pass@localhost:8888).
spring.cloud.config.auth.user | string | (Required) username if using auth
spring.cloud.config.auth.pass | string | (Required) password if using auth

### `application.yml` Application Config Properties
Option | Type | Description
------ | -------- | -----------
spring.cloud.config.name | String | (Optional) You can override/specify your application name here, or in bootstrap.yml. This is an option so that you can share bootstrap.yml with other applications but still use your own application name.
profiles | string | (Optional) Comma separated string of profiles. Indicates which profiles the properties in the current yaml document apply to.
any.property.you.need | ? | This is where you define whatever properties your application needs to be awesome!