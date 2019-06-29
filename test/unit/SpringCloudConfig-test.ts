import { assert } from 'chai';
import decache from 'decache';
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { ConfigObject, CloudConfigOptions } from '../../src';

chai.use(chaiAsPromised);
chai.should();

describe('SpringCloudConfig', function() {
	const sandbox = sinon.createSandbox();
	let cloudLoadStub;
	let SpringCloudConfig;
	let cloudConfigClient;

	describe('#readApplicationConfig()', function() {

		beforeEach(async function() {
			SpringCloudConfig = require('../../src');
			cloudConfigClient = require("cloud-config-client");
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
		});

		it('should read application config without profile-specific yaml', async function() {
			const appConfigPath: string = './test/fixtures/readAppConfig/singleAppYaml';
			const activeProfiles: string[] = ['dev1'];

			const readApplicationConfig: Promise<ConfigObject> = SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
			return readApplicationConfig.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read application config without profiles', async function() {
			const appConfigPath: string = './test/fixtures/readAppConfig/multiAppYaml';
			const activeProfiles: string[] = [];

			const readApplicationConfig: Promise<ConfigObject> = SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
			return readApplicationConfig.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should read multi application config with profiles', async function() {
			const appConfigPath: string = './test/fixtures/readAppConfig/multiAppYaml';
			const activeProfiles: string[] = ['dev2'];

			const readApplicationConfig: Promise<ConfigObject> = SpringCloudConfig.readApplicationConfig(appConfigPath, activeProfiles);
			return readApplicationConfig.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.dev2.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

	});

	describe('#readCloudConfig()', function() {

		beforeEach(async function() {
			SpringCloudConfig = require('../../src');
			cloudConfigClient = require("cloud-config-client");
			cloudLoadStub = sandbox.stub(cloudConfigClient, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
		});

		it('should skip cloud config when not enabled', async function() {
			const bootstrapConfig: ConfigObject = {
				spring: {cloud: {config: {enabled: false}}}
			};

			const readCloudConfig: Promise<ConfigObject> = SpringCloudConfig.readCloudConfig(bootstrapConfig);
			return readCloudConfig.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should skip cloud config if unreachable', async function() {
			cloudLoadStub.throws(new Error('some error'));
			const bootstrapConfig: ConfigObject = {
				spring: {cloud: {config: {
					enabled: true,
					name: 'the-application-name',
					endpoint: 'http://somenonexistentdomain:8888'
				}}},
			};

			const readCloudConfig: Promise<ConfigObject> = SpringCloudConfig.readCloudConfig(bootstrapConfig);
			return readCloudConfig.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

	});

	describe('#load()', function() {

		beforeEach(async function() {
			SpringCloudConfig = require('../../src');
			cloudConfigClient = require("cloud-config-client");
			cloudLoadStub = sandbox.stub(cloudConfigClient, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
		});

		it('should fail without app config path', async function() {
			// @ts-ignore
			const options: CloudConfigOptions = {
				activeProfiles: []
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail without activeProfiles', async function() {
			// @ts-ignore
			const options: CloudConfigOptions = {
				configPath: './test/fixtures/load/config',
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid bootstrap path', async function() {
			const options: CloudConfigOptions = {
				bootstrapPath: './badPath/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with invalid app config path', async function() {
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './badPath/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should fail with bad bootstrap config', async function() {
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/badBootstrap',
				configPath: './test/fixtures/load/config',
				activeProfiles: []
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.rejected;
		});

		it('should succeed with no bootstrap path and same config folder', async function() {
			cloudLoadStub.returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			const options: CloudConfigOptions = {
				configPath: './test/fixtures/load/configSameFolder',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with no profile', async function() {
			cloudLoadStub.returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default.com');
			});
		});

		it('should load default configs with app name override', async function() {
			cloudLoadStub.returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/appNameConfig',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'custom-app-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
			});
		});
		
		it('should load dev configs with dev profile', async function() {
			cloudLoadStub.returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev2'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev.com');
			});
		});

		it('should load cloud configs with default profile', async function() {
			cloudLoadStub.returns(
				Promise.resolve({
					forEach(callback, aBoolValue) {
						callback('testUrl', 'http://www.default-local.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['default'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should load cloud configs with dev profile', async function() {
			cloudLoadStub.returns(
				Promise.resolve({
					forEach(callback, aBoolValue) {
						callback('testUrl', 'http://www.dev-cloud.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: ['dev1'],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			return load.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(config.spring.cloud.config.endpoint, 'http://dev-config-server:8888');
				assert.deepEqual(config.spring.cloud.config.label, 'master');
				assert.deepEqual(config.testUrl, 'http://www.dev-cloud.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});
	});

	describe('#instance()', function() {

		beforeEach(async function() {
			SpringCloudConfig = require('../../src');
			cloudConfigClient = require("cloud-config-client");
			cloudLoadStub = sandbox.stub(cloudConfigClient, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
			decache('../../src');
		});

		it('should throw error if not loaded yet', async function() {
			chai.expect(() => SpringCloudConfig.instance()).to.throw();
		});

		it('should return instance with defaults', async function() {
			cloudLoadStub.returns(
				Promise.resolve({forEach(callback, aBoolValue) {}})
			);
			const options: CloudConfigOptions = {
				bootstrapPath: './test/fixtures/load/commonConfig',
				configPath: './test/fixtures/load/config',
				activeProfiles: [],
				level: 'debug'
			};

			const load: Promise<ConfigObject> = SpringCloudConfig.load(options);
			chai.expect(load).to.eventually.be.fulfilled.then(() => {
				const theConfig: ConfigObject = SpringCloudConfig.instance();
				assert.deepEqual(theConfig.spring.cloud.config.name, 'the-application-name');
				assert.deepEqual(theConfig.spring.cloud.config.endpoint, 'http://localhost:8888');
				assert.deepEqual(theConfig.testUrl, 'http://www.default.com');
			});
		});
		
	});

});