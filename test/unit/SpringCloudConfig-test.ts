import { assert } from 'chai';
import * as sinon from 'sinon';
import * as SpringCloudConfig from '../../src';
import * as cloudConfigClient from "cloud-config-client";

describe('SpringCloudConfig', function() {

	describe('#readApplicationConfig()', function() {

		it('should read application config without profile-specific yaml', async function() {
			let appConfigPath = './test/fixtures/readAppConfig/singleAppYaml';
			let activeProfiles = ['dev1'];

			try {
				const config = await SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}
			catch (error) {
				assert.fail('an error', 'success', error.message);
			}
		});

		it('should read application config without profiles', async function() {
			let appConfigPath = './test/fixtures/readAppConfig/multiAppYaml';
			let activeProfiles = [];

			try {
				const config = await SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}
			catch (error) {
				assert.fail('an error', 'success', error.message);
			}
		});

		it('should read multi application config with profiles', async function() {
			let appConfigPath = './test/fixtures/readAppConfig/multiAppYaml';
			let activeProfiles = ['dev2'];

			try {
				const config = await SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			}
			catch (error) {
				assert.fail('an error', 'success', error.message);
			}
		});

	});

	describe('#readCloudConfig()', function() {

		beforeEach(async function() {
			this.sandbox = sinon.sandbox.create();
		});

		afterEach(async function() {
			this.sandbox.restore();
		});

		it('should skip cloud config when not enabled', async function() {
			let bootstrapConfig = {
				spring: {cloud: {config: {enabled: false}}}
			};

			try {
				const config = await SpringCloudConfig.readCloudConfig(bootstrapConfig);
				assert.deepEqual(config, {});
			}
			catch (error) {
				assert.fail('an error', 'success', error.message);
			}
		});

		it('should skip cloud config if unreachable', async function() {
			this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.reject(new Error('some error'))
			);
			let bootstrapConfig = {
				spring: {cloud: {config: {
					enabled: true,
					name: 'the-application-name',
					endpoint: 'http://somenonexistentdomain:8888'
				}}},
			};

			try {
				const config = await SpringCloudConfig.readCloudConfig(bootstrapConfig);
				assert.deepEqual(config, {});
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});

	});

	describe('#load()', function() {

		beforeEach(async function() {
			this.sandbox = sinon.sandbox.create();
		});

		afterEach(async function() {
			this.sandbox.restore();
		});

		it('should fail without app config path', async function() {
			let options = {
				activeProfiles: []
			}

			try {
				// @ts-ignore
				const config = await SpringCloudConfig.load(options);
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}
			catch (error) {
				assert.isOk('Success', 'Load failed as expected.');
			}
		});

		it('should fail without activeProfiles', async function() {
			let options = {
				configPath: './test/fixtures/load/config',
			}

			try {
				// @ts-ignore
				const config = await SpringCloudConfig.load(options);
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}
			catch (error) {
				assert.isOk('Success', 'Load failed as expected.');
			}
		});

		it('should fail with invalid bootstrap path', async function() {
			let options = {
				bootstrapPath: './badPath/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}
			catch (error) {
				assert.isOk('Success', 'Load failed as expected.');
			}
		});

		it('should fail with invalid app config path', async function() {
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './badPath/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.fail('did not fail', 'a failure', 'this attempt should fail');
			}
			catch (error) {
				assert.isOk('Success', 'Load failed as expected.');
			}
		});

		it('should succeed with no bootstrap path and same config folder', async function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				configPath: './test/fixtures/load/configSameFolder',
				activeProfiles: [],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});

		it('should load default configs with no profile', async function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});

		it('should load default configs with app name override', async function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/appNameConfig',
				activeProfiles: [],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'custom-app-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});
		
		it('should load dev configs with dev profile', async function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev2'],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});

		it('should load cloud configs with default profile', async function() {
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

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});

		it('should load cloud configs with dev profile', async function() {
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

			try {
				const config = await SpringCloudConfig.load(options);
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev-cloud.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});
	});

	describe('#instance()', function() {

		beforeEach(async function() {
			this.sandbox = sinon.sandbox.create();
		});

		afterEach(async function() {
			this.sandbox.restore();
		});

		it('should return instance with defaults', async function() {
			var cloudLoadStub = this.sandbox.stub(cloudConfigClient, 'load').returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			let options = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			}

			try {
				const config = await SpringCloudConfig.load(options);
				let theConfig = SpringCloudConfig.instance();
				assert.deepEqual(theConfig.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(theConfig.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
			}
			catch (error) {
				assert.fail("Error", "Success", JSON.stringify(error.message));
			}
		});
		
	});

});