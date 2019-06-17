import { assert } from 'chai';
import {
	readYaml,
	mergeProperties,
	parsePropertiesToObjects,
	createObjectForProperty,
	shouldUseDocument
} from '../../src/utils';

describe('utils', function() {

	describe("#readYaml()", function () {
		it("should read test yaml without profiles", function (done) {
			const testProperties = readYaml('./test/fixtures/readYaml/test.yml')
			assert.deepEqual(testProperties['test.unit.testBool'], true);
			assert.deepEqual(testProperties['test.unit.testString'], 'testing');
			assert.deepEqual(testProperties['test.unit.testNumber'], 12345);
			done();
		});

		it("should read yaml and parse doc by profiles", function (done) {
			const testProperties = readYaml('./test/fixtures/readYaml/test-yaml-docs.yml', ['development'])
			assert.deepEqual(testProperties['test.unit.testBool'], true);
			assert.deepEqual(testProperties['test.unit.testString'], 'testing again');
			assert.deepEqual(testProperties['test.unit.testNumber'], 23456);
			done();
		});

		it("should read yaml and parse doc by profiles, even with multiple profiles", function (done) {
			const testProperties = readYaml('./test/fixtures/readYaml/test-yaml-with-profiles.yml', ['env1','env4'])
			assert.deepEqual(testProperties['urlProperty'], 'http://www.testdomain-shared.com');
			assert.deepEqual(testProperties['propertyGroup']['groupProperty'], false);
			done();
		});
	});

	describe("#mergeProperties()", function () {
		it("should merge properties between two files", function () {
			return new Promise((resolve, reject) => {
				var obj1 = {
					'test.unit.testBool': true,
					'test.unit.testString': 'testing',
					'test.unit.testNumber': 12345
				};
				var obj2 = {
					'test.unit.testBool': true,
					'test.unit.testString': 'testing again',
					'test.unit.testNumber': 12345
				};

				var mergedProperties = mergeProperties([obj1, obj2]);
				assert.deepEqual(mergedProperties['test.unit.testBool'], true);
				assert.deepEqual(mergedProperties['test.unit.testString'], 'testing again');
				assert.deepEqual(mergedProperties['test.unit.testNumber'], 12345);
				resolve();
			});
		});
	});

	describe("#parsePropertiesToObjects()", function () {
		it("should skip undefined object", function () {
			return new Promise((resolve, reject) => {
				let mergedProperties;
				let configObject = parsePropertiesToObjects(mergedProperties);
				assert.deepEqual(configObject, {});
				resolve();
			});
		});
		it("should parse dot-separated properties into JS object", function () {
			return new Promise((resolve, reject) => {
				let mergedProperties = {
					'test.unit.testBool': true,
					'test.unit.testString': 'testing again',
					'test.unit.testNumber': 12345
				};
				let expectedObject = {
					test: {
						unit: {
							testBool: true,
							testString: 'testing again',
							testNumber: 12345
						}
					}
				};
				let configObject = parsePropertiesToObjects(mergedProperties);
				assert.deepEqual(configObject, expectedObject);
				resolve();
			});
		});
	});

	describe("#createObjectForProperty()", function () {
		it("should construct a JS Object given a Boolean property's keys and value", function () {
			return new Promise((resolve, reject) => {
				let expectedObjectFromBool = {
					test: {
						unit: {
							testBool: true
						}
					}
				};
				let boolObject = createObjectForProperty(['test', 'unit', 'testBool'], true);
				assert.deepEqual(boolObject, expectedObjectFromBool);
				resolve();
			});
		});

		it("should construct a JS Object given a String property's keys and value", function () {
			return new Promise((resolve, reject) => {
				let expectedObjectFromString = {
					test: {
						unit: {
							testString: 'testing'
						}
					}
				};
				let stringObject = createObjectForProperty(['test', 'unit', 'testString'], 'testing');
				assert.deepEqual(stringObject, expectedObjectFromString);
				resolve();
			});
		});

		it("should construct a JS Object given a Number property's keys and value", function () {
			return new Promise((resolve, reject) => {
				let expectedObjectFromNumber = {
					test: {
						unit: {
							testNumber: 12345
						}
					}
				};
				let numberObject = createObjectForProperty(['test', 'unit', 'testNumber'], 12345);
				assert.deepEqual(numberObject, expectedObjectFromNumber);
				resolve();
			});
		});
	});

	describe('#shouldUseDocument()', function() {

		it('should not use undefined document', function(done) {
			let doc = undefined;
			let activeProfiles = ['aProfile'];
			// @ts-ignore
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
			done();
		});

		it('should not use document that has profiles, but no activeProfiles input',
				function(done) {
					let doc = {'profiles': 'aProfile'};
					let activeProfiles;
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
					done();
				});

		it('should use document when doc.profiles is undefined', function(done) {
			let doc = {};
			let activeProfiles = ['aProfile'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			done();
		});

		it('should use document when activeProfiles matches a single doc.profiles',
				function(done) {
					let doc = {'profiles': 'devEast'};
					let activeProfiles = ['devEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					done();
				});

		it('should use document when one of activeProfiles matches one of doc.profiles',
				function(done) {
					let doc = {'profiles': 'devEast,devWest,stagingEast'};
					let activeProfiles = ['devEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					activeProfiles = ['devWest'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					activeProfiles = ['stagingEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					done();
				});

		it('should use document when multiple doc.profiles match active profiles',
				function(done) {
					let doc = {'profiles': 'devEast,devWest,stagingEast'};
					let activeProfiles = ['devEast','devWest'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					activeProfiles = ['devWest','stagingEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					activeProfiles = ['stagingEast','devEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					done();
				});

		it('should NOT use document when not operator used in doc.profiles for active profile',
				function(done) {
					let doc = {'profiles': 'devEast,!devWest,stagingEast'};
					let activeProfiles = ['devEast','devWest'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
					activeProfiles = ['devWest','stagingEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
					done();
				});

		it('should use document when not operator used in doc.profiles for non-active profile',
				function(done) {
					let doc = {'profiles': 'devEast,devWest,!stagingEast'};
					let activeProfiles = ['devEast','devWest'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					doc = {'profiles': 'devEast,!devWest,stagingEast'};
					activeProfiles = ['devEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					doc = {'profiles': '!devEast,devWest,stagingEast'};
					activeProfiles = ['devWest','stagingEast'];
					assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
					done();
				});
	});
});