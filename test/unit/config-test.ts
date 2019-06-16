import { assert } from 'chai';
import * as sinon from 'sinon';
import springCloudConfig from '../../index';
import * as cloudConfigClient from "cloud-config-client";

describe('spring-cloud-config-client', function() {

	describe('#readApplicationConfig()', function() {
		it('should read application config without profile-specific yaml', function() {
			let appConfigPath = './test/fixtures/readAppConfig/singleAppYaml';
			let activeProfiles = ['dev1'];
			return springCloudConfig.readApplicationConfig(appConfigPath, activeProfiles).then((config) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}, (error) => {
				assert.fail('an error', 'success', error.message);
			});
		});
		it('should read application config without profiles', function() {
			let appConfigPath = './test/fixtures/readAppConfig/multiAppYaml';
			let activeProfiles = [];
			return springCloudConfig.readApplicationConfig(appConfigPath, activeProfiles).then((config) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}, (error) => {
				assert.fail('an error', 'success', error.message);
			});
		});
		it('should read multi application config with profiles', function() {
			let appConfigPath = './test/fixtures/readAppConfig/multiAppYaml';
			let activeProfiles = ['dev2'];
			return springCloudConfig.readApplicationConfig(appConfigPath, activeProfiles).then((config) => {
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			}, (error) => {
				assert.fail('an error', 'success', error.message);
			});
		});
	});

	describe('#readCloudConfig()', function() {
		it('should skip cloud config when not enabled', function() {
			let bootstrapConfig = {
				spring: {cloud: {config: {enabled: false}}}
			};
			return springCloudConfig.readCloudConfig(bootstrapConfig).then((config) => {
				assert.deepEqual(config, {});
			}, (error) => {
				assert.fail('an error', 'success', error.message);
			});
		});

		it('should skip cloud config if unreachable', function() {
			let bootstrapConfig = {
				spring: {cloud: {config: {
					enabled: true,
					name: 'the-application-name',
					endpoint: 'http://localhost:8888'
				}}},
			};
			return springCloudConfig.readCloudConfig(bootstrapConfig).then((config) => {
				assert.deepEqual(config, {});
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});
	});

	describe('#load()', function() {

		beforeEach(function () {
			this.sandbox = sinon.sandbox.create();
		});

		afterEach(function () {
			this.sandbox.restore();
		});

		it('should fail without app config path', function() {
			let options = {
				activeProfiles: []
			}
			return springCloudConfig.load(options).then((config) => {
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}, (error) => {
				assert.isOk('Success', 'Load failed as expected.');
			});
		});

		it('should fail without activeProfiles', function() {
			let options = {
				configPath: './test/fixtures/load/config',
			}
			return springCloudConfig.load(options).then((config) => {
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}, (error) => {
				assert.isOk('Success', 'Load failed as expected.');
			});
		});

		it('should fail with invalid bootstrap path', function() {
			let options = {
				bootstrapPath: './badPath/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}, (error) => {
				assert.isOk('Success', 'Load failed as expected.');
			});
		});

		it('should fail with invalid app config path', function() {
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './badPath/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}, (error) => {
				assert.isOk('Success', 'Load failed as expected.');
			});
		});

		it('should succeed with no bootstrap path and same config folder', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				configPath: './test/fixtures/load/configSameFolder',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});

		it('should load default configs with no profile', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});

		it('should load default configs with app name override', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/appNameConfig',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'custom-app-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});
		
		it('should load dev configs with dev profile', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev2'],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});

		it('should load cloud configs with default profile', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({
					forEach(callback, aBoolValue) {
						callback('testUrl', 'http://www.default-local.com');
						callback('featureFlags.feature1', false);
						callback('featureFlags.feature2', false);
					}
				})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['default'],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});

		it('should load cloud configs with dev profile', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({
					forEach(callback, aBoolValue) {
						callback('testUrl', 'http://www.dev-cloud.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev1'],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev-cloud.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});
	});

	describe('#instance()', function() {

		beforeEach(function () {
			this.sandbox = sinon.sandbox.create();
		});

		afterEach(function () {
			this.sandbox.restore();
		});

		it('should return instance with defaults', function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}
			return springCloudConfig.load(options).then((config) => {
				let theConfig = springCloudConfig.instance();
				assert.deepEqual(theConfig.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(theConfig.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
			}, (error) => {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			});
		});
		
	});

});