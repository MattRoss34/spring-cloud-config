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

