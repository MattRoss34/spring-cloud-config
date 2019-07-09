import * as chai from 'chai';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import { instance, load, Config, CloudConfigOptions, ConfigObject } from '../../src';

chai.use(chaiAsPromised);
chai.should();

describe('index', function() {
	let sandbox = sinon.createSandbox();
	let loadStub: SinonStub;
	let instanceStub: SinonStub;

	describe('#load()', function() {

		beforeEach(async function() {
			loadStub = sandbox.stub(Config, 'load');
		});

		afterEach(async function() {
			sandbox.restore();
		});

		it('should throw error if library method throws error', async function() {
            loadStub.rejects(new Error('Some Error'));
			const options: CloudConfigOptions = {
				bootstrapPath: 'test',
				configPath: 'test',
				activeProfiles: ['test1'],
				level: 'debug'
			};

			const loadPromise: Promise<ConfigObject> =  load(options);
			return loadPromise.should.eventually.be.rejectedWith('Some Error');
		});

		it('should resolve configuration properties', async function() {
            loadStub.resolves({
                testUrl: 'http://www.default.com',
                featureFlags: {
                    feature1: false,
                    feature2: true
                }
            });
			const options: CloudConfigOptions = {
				bootstrapPath: 'test',
				configPath: 'test',
				activeProfiles: ['test1'],
				level: 'debug'
			};

			const loadPromise: Promise<ConfigObject> =  load(options);
			return loadPromise.should.eventually.be.fulfilled.then((config: ConfigObject) => {
				assert.deepEqual(config.testUrl, 'http://www.default.com');
				assert.deepEqual(config.featureFlags.feature1, false);
				assert.deepEqual(config.featureFlags.feature2, true);
			});
		});

	});

	describe('#instance()', function() {

		beforeEach(async function() {
            loadStub = sandbox.stub(Config, 'load');
            instanceStub = sandbox.stub(Config, 'instance');
		});

		afterEach(async function() {
			sandbox.restore();
		});

		it('should throw error if library method throws error', async function() {
            instanceStub.throws(new Error('Some Error'));

            return chai.expect(() => instance()).to.throw('Some Error');
		});

		it('should resolve configuration properties', async function(done: Function) {
            instanceStub.returns({
                testUrl: 'http://www.default.com',
                featureFlags: {
                    feature1: false,
                    feature2: true
                }
            });

			const config: ConfigObject = instance();
            assert.deepEqual(config.testUrl, 'http://www.default.com');
            assert.deepEqual(config.featureFlags.feature1, false);
            assert.deepEqual(config.featureFlags.feature2, true);
            done();
		});

	});

});