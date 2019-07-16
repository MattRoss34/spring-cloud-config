import { assert } from 'chai';
import { getSpringApplicationJsonFromEnv, getPredefinedEnvProperties } from '../../../src/utils';

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

	describe('#getPredefinedEnvProperties', function () {

        afterEach(function() {
			delete process.env.SPRING_CONFIG_ENDPOINT;
		});

		it('should return empty if all are undefined', function (done: Function) {
            assert.deepEqual(getPredefinedEnvProperties(), {});
            done();
        });

		it('should return data when defined', function (done: Function) {
            process.env.SPRING_CONFIG_ENDPOINT = 'https://sometesturl:8888';
            assert.deepEqual(
                getPredefinedEnvProperties(),
                { spring: { cloud: { config: { endpoint: 'https://sometesturl:8888' }}}}
            );
            done();
        });

    });

});