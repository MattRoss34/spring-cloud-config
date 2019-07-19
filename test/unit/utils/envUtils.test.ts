import { assert } from 'chai';
import { getSpringApplicationJsonFromEnv, getPropertiesFromEnv } from '../../../src/utils';
import { ENV_BOOTSTRAP_PROPERTIES } from '../../../src/constants';

describe('envUtils', function() {

	describe('#getSpringApplicationJsonFromEnv', function () {

        afterEach(function() {
			delete process.env.APPLICATION_JSON;
		});

		it('should return empty if undefined', function (done: Function) {
            assert.deepEqual(getSpringApplicationJsonFromEnv(), {});
            done();
        });

		it('should return empty if empty', function (done: Function) {
            process.env.APPLICATION_JSON = '{}';
            assert.deepEqual(getSpringApplicationJsonFromEnv(), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.APPLICATION_JSON = '{ "testProp": "testValue" }';
            assert.deepEqual(getSpringApplicationJsonFromEnv(), { 'testProp': 'testValue' });
            done();
        });

    });

	describe('#getPropertiesFromEnv', function () {

        afterEach(function() {
			delete process.env.SPRING_CONFIG_ENDPOINT;
		});

		it('should return empty if all are undefined', function (done: Function) {
            assert.deepEqual(getPropertiesFromEnv(ENV_BOOTSTRAP_PROPERTIES), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.SPRING_CONFIG_ENDPOINT = 'https://sometesturl:8888';
            assert.deepEqual(
                getPropertiesFromEnv(ENV_BOOTSTRAP_PROPERTIES),
                { spring: { cloud: { config: { endpoint: 'https://sometesturl:8888' }}}}
            );
            done();
        });

    });

});