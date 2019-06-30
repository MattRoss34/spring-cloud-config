import { assert } from 'chai';
import decache from 'decache';
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { ConfigObject, CloudConfigOptions, RetryConfig, RetryState } from '../../src';

chai.use(chaiAsPromised);
chai.should();

describe('RetryState', function() {

	describe('#constructor()', function() {

		it('should initialize state with default values', async function() {
            const retryState: RetryState = new RetryState();

            assert.deepEqual(retryState.active, false);
            assert.deepEqual(retryState.attempts, 0);
            assert.deepEqual(retryState.currentInterval, 0);
            assert.deepEqual(retryState.maxAttempts, 6);
            assert.deepEqual(retryState.maxInterval, 1500);
            assert.deepEqual(retryState.initialInterval, 1000);
            assert.deepEqual(retryState.multiplier, 1.1);
		});

		it('should initialize using provided retry config', async function() {
            const retryConfig: RetryConfig = {
                enabled: true,
                'max-attempts': 10,
                'max-interval': 2000,
                'initial-interval': 1500,
                multiplier: 1.5
            };
            const retryState: RetryState = new RetryState(retryConfig);

            assert.deepEqual(retryState.active, false);
            assert.deepEqual(retryState.attempts, 0);
            assert.deepEqual(retryState.currentInterval, 0);
            assert.deepEqual(retryState.maxAttempts, 10);
            assert.deepEqual(retryState.maxInterval, 2000);
            assert.deepEqual(retryState.initialInterval, 1500);
            assert.deepEqual(retryState.multiplier, 1.5);
		});

	});

	describe('#registerRetry()', function() {

		it('Should set active and init attempts and interval on first register', async function() {
            const retryState: RetryState = new RetryState();

            retryState.registerRetry();

            assert.deepEqual(retryState.active, true);
            assert.deepEqual(retryState.attempts, 1);
            assert.deepEqual(retryState.currentInterval, 1000);
            assert.deepEqual(retryState.maxAttempts, 6);
            assert.deepEqual(retryState.maxInterval, 1500);
            assert.deepEqual(retryState.initialInterval, 1000);
            assert.deepEqual(retryState.multiplier, 1.1);
		});

		it('Should set active and increment attempts and interval on second register', async function() {
            const retryState: RetryState = new RetryState();

            retryState.registerRetry();
            retryState.registerRetry();

            assert.deepEqual(retryState.active, true);
            assert.deepEqual(retryState.attempts, 2);
            assert.deepEqual(retryState.currentInterval, 1100);
            assert.deepEqual(retryState.maxAttempts, 6);
            assert.deepEqual(retryState.maxInterval, 1500);
            assert.deepEqual(retryState.initialInterval, 1000);
            assert.deepEqual(retryState.multiplier, 1.1);
		});

		it('Should not allow attempts to exceed max', async function() {
            const retryState: RetryState = new RetryState({
                enabled: true,
                'max-attempts': 1
            });

            retryState.registerRetry();
            chai.expect(() => retryState.registerRetry()).to.throw();
		});

		it('Should not allow interval to exceed max', async function() {
            const retryState: RetryState = new RetryState({
                enabled: true,
                'max-interval': 1050
            });

            retryState.registerRetry();
            retryState.registerRetry();

            assert.deepEqual(retryState.currentInterval, 1050);
		});

      });

      describe('#reset()', function() {

		it('should reset state with initial values', async function() {
                  const retryState: RetryState = new RetryState();

                  retryState.registerRetry();
                  retryState.registerRetry();
                  retryState.reset();

                  assert.deepEqual(retryState.active, false);
                  assert.deepEqual(retryState.attempts, 0);
                  assert.deepEqual(retryState.currentInterval, 0);
                  assert.deepEqual(retryState.maxAttempts, 6);
                  assert.deepEqual(retryState.maxInterval, 1500);
                  assert.deepEqual(retryState.initialInterval, 1000);
                  assert.deepEqual(retryState.multiplier, 1.1);
		});

	});

});