import 'reflect-metadata';
import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject, RetryOptions } from '../../../src';
import { SpringCloudConfigGatewayImpl } from '../../../src/gateways';
import { SpringCloudConfigServiceImpl } from '../../../src/services';

chai.use(chaiAsPromised);
chai.should();

describe('SpringCloudConfigServiceImpl', function() {
	const sandbox = sinon.createSandbox();
	const springCloudConfigGatewayImpl = new SpringCloudConfigGatewayImpl();
	const springCloudConfigServiceImpl = new SpringCloudConfigServiceImpl(springCloudConfigGatewayImpl);

	let gatewayStub: SinonStub;
	let bootstrapConfig: ConfigObject;
	let retryOptions: RetryOptions;

	describe('#getConfigFromServer()', function() {

		beforeEach(async function() {
			gatewayStub = sandbox.stub(springCloudConfigGatewayImpl, 'getConfigFromServer');
			bootstrapConfig = {
				spring: { cloud: { config: {
					enabled: true,
					name: 'the-application-name',
					endpoint: 'http://somenonexistentdomain:8888'
				}}},
			};
			retryOptions = {
				enabled: true,
				'initial-interval': 100,
				'max-interval': 150,
				'max-attempts': 3
			};
		});

		afterEach(async function() {
			sandbox.restore();
		});

		it('should skip cloud config when not enabled', async function() {
			bootstrapConfig.spring.cloud.config.enabled = false;

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should skip cloud config when gateway throws error (without fail-fast)', async function() {
			gatewayStub.throws(new Error('some error'));

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should throw error when gateway throws error and fail-fast is true, retry disabled', async function() {
			gatewayStub.throws(new Error('some error'));
			bootstrapConfig.spring.cloud.config['fail-fast'] = true;

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should throw error when gateway throws error after max retry attempts is exceeded', async function() {
			gatewayStub.throws(new Error('some error'));
			bootstrapConfig.spring.cloud.config['fail-fast'] = true;
			bootstrapConfig.spring.cloud.config.retry = {
				enabled: true,
				'initial-interval': 100,
				'max-interval': 150,
				'max-attempts': 3
			};

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.rejectedWith('Error retrieving remote configuration: Maximum retries exceeded.');
		});

		it('should succeed if remote configuration retrieval succeeds', async function() {
			gatewayStub.returns({
				testUrl: 'http://www.default-local.com',
				featureFlags: {
					feature1: true,
					feature2: false
				}
			});
			bootstrapConfig.spring.cloud.config['fail-fast'] = true;

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

		it('should succeed if retry succeeds', async function() {
			gatewayStub
				.onFirstCall().throws(new Error('some error'))
				.onSecondCall().throws(new Error('some error'))
				// tslint:disable-next-line: no-empty
				.onThirdCall().returns(Promise.resolve({forEach(callback: Function, aBoolValue: boolean) {}}));
			bootstrapConfig.spring.cloud.config['fail-fast'] = true;
			bootstrapConfig.spring.cloud.config.retry = {
				enabled: true,
				'initial-interval': 100,
				'max-interval': 150,
				'max-attempts': 3
			};

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigServiceImpl.getConfigFromServer(bootstrapConfig);

			return getConfigFromServer.should.eventually.be.fulfilled;
		});

	});

});