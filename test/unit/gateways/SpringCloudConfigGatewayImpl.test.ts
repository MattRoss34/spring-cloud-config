import 'reflect-metadata';
import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { ConfigObject, ConfigClientOptions } from '../../../src';
import * as CloudConfigClient from 'cloud-config-client';
import { SpringCloudConfigGatewayImpl } from '../../../src/gateways';

chai.use(chaiAsPromised);
chai.should();

describe('SpringCloudConfigGatewayImpl', function() {
	const sandbox = sinon.createSandbox();
	const springCloudConfigGatewayImpl = new SpringCloudConfigGatewayImpl();
	const testOptions: ConfigClientOptions = {
		enabled: true,
		name: 'MyTestApp',
		'fail-fast': true
	};
	let cloudLoadStub: SinonStub;

	describe('#getConfigFromServer()', function() {

		beforeEach(async function() {
			cloudLoadStub = sandbox.stub(CloudConfigClient, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
		});

		it('should throw error if cloud config client throws error', async function() {
			cloudLoadStub.throws(new Error('some error'));

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGatewayImpl.getConfigFromServer(testOptions);

			return getConfigFromServer.should.eventually.be.rejected;
		});

		it('should succeed if cloud config client succeeds without properties', async function() {
			cloudLoadStub.returns(
				Promise.resolve(undefined)
			);

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGatewayImpl.getConfigFromServer(testOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config, {});
			});
		});

		it('should succeed if cloud config client succeeds with properties', async function() {
			cloudLoadStub.returns(
				Promise.resolve({
					forEach(callback: Function, aBoolValue: boolean) {
						callback('testUrl', 'http://www.default-local.com');
						callback('featureFlags.feature1', true);
						callback('featureFlags.feature2', false);
					}
				})
			);

			const getConfigFromServer: Promise<ConfigObject> =
				springCloudConfigGatewayImpl.getConfigFromServer(testOptions);

			return getConfigFromServer.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default-local.com');
				assert.deepEqual(config.featureFlags.feature1, true);
				assert.deepEqual(config.featureFlags.feature2, false);
			});
		});

	});

});