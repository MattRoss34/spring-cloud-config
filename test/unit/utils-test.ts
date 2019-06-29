import { assert } from 'chai';
import {
	readYaml,
	mergeProperties,
	parsePropertiesToObjects,
	createObjectForProperty,
	shouldUseDocument
} from '../../src/utils';
import { Document } from '../../src';

describe('utils', function() {

	describe("#readYaml()", function() {

		it("should read test yaml without profiles", async function() {
			const testProperties: Document = readYaml('./test/fixtures/readYaml/test.yml')
			assert.deepEqual(testProperties['test.unit.testBool'], true);
			assert.deepEqual(testProperties['test.unit.testString'], 'testing');
			assert.deepEqual(testProperties['test.unit.testNumber'], 12345);
		});

		it("should read yaml and parse doc by profiles", async function() {
			const testProperties: Document = readYaml('./test/fixtures/readYaml/test-yaml-docs.yml', ['development'])
			assert.deepEqual(testProperties['test.unit.testBool'], true);
			assert.deepEqual(testProperties['test.unit.testString'], 'testing again');
			assert.deepEqual(testProperties['test.unit.testNumber'], 23456);
		});

		it("should read yaml and parse doc by profiles, even with multiple profiles", async function() {
			const testProperties: Document = readYaml('./test/fixtures/readYaml/test-yaml-with-profiles.yml', ['env1','env4'])
			assert.deepEqual(testProperties['urlProperty'], 'http://www.testdomain-shared.com');
			assert.deepEqual(testProperties['propertyGroup']['groupProperty'], false);
		});

	});

	describe("#mergeProperties()", function() {

		it("should merge properties between two files", async function() {
			var obj1: object = {
				'test.unit.testBool': true,
				'test.unit.testString': 'testing',
				'test.unit.testNumber': 12345
			};
			var obj2: object = {
				'test.unit.testBool': true,
				'test.unit.testString': 'testing again',
				'test.unit.testNumber': 12345
			};

			var mergedProperties: object = mergeProperties([obj1, obj2]);
			assert.deepEqual(mergedProperties['test.unit.testBool'], true);
			assert.deepEqual(mergedProperties['test.unit.testString'], 'testing again');
			assert.deepEqual(mergedProperties['test.unit.testNumber'], 12345);
		});

	});

	describe("#parsePropertiesToObjects()", function() {

		it("should skip undefined object", async function() {
			const mergedProperties: object | undefined = undefined;
			const configObject: object = parsePropertiesToObjects(mergedProperties);
			assert.deepEqual(configObject, {});
		});

		it("should parse dot-separated properties into JS object", async function() {
			const mergedProperties: object = {
				'test.unit.testBool': true,
				'test.unit.testString': 'testing again',
				'test.unit.testNumber': 12345
			};
			const expectedObject: object = {
				test: {
					unit: {
						testBool: true,
						testString: 'testing again',
						testNumber: 12345
					}
				}
			};
			const configObject: object = parsePropertiesToObjects(mergedProperties);
			assert.deepEqual(configObject, expectedObject);
		});

	});

	describe("#createObjectForProperty()", function() {

		it("should construct a JS Object given a Boolean property's keys and value", async function() {
			const expectedObjectFromBool: object = {
				test: {
					unit: {
						testBool: true
					}
				}
			};
			const boolObject: object = createObjectForProperty(['test', 'unit', 'testBool'], true);
			assert.deepEqual(boolObject, expectedObjectFromBool);
		});

		it("should construct a JS Object given a String property's keys and value", async function() {
			const expectedObjectFromString: object = {
				test: {
					unit: {
						testString: 'testing'
					}
				}
			};
			const stringObject: object = createObjectForProperty(['test', 'unit', 'testString'], 'testing');
			assert.deepEqual(stringObject, expectedObjectFromString);
		});

		it("should construct a JS Object given a Number property's keys and value", async function() {
			const expectedObjectFromNumber: object = {
				test: {
					unit: {
						testNumber: 12345
					}
				}
			};
			const numberObject: object = createObjectForProperty(['test', 'unit', 'testNumber'], 12345);
			assert.deepEqual(numberObject, expectedObjectFromNumber);
		});

	});

	describe('#shouldUseDocument()', function() {

		it('should not use undefined document', async function() {
			const doc: Document | undefined = undefined;
			const activeProfiles: string[] = ['aProfile'];
			// @ts-ignore
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
		});

		it('should not use document that has profiles, but no activeProfiles input', async function() {
			const doc: Document = {'profiles': 'aProfile'};
			const activeProfiles: string[] | undefined = undefined;
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
		});

		it('should use document when doc.profiles is undefined', async function() {
			const doc: Document = {};
			const activeProfiles: string[] = ['aProfile'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
		});

		it('should use document when activeProfiles matches a single doc.profiles', async function() {
			const doc: Document = {'profiles': 'devEast'};
			const activeProfiles: string[] = ['devEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
		});

		it('should use document when one of activeProfiles matches one of doc.profiles', async function() {
			const doc: Document = {'profiles': 'devEast,devWest,stagingEast'};
			let activeProfiles: string[] = ['devEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			activeProfiles = ['devWest'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			activeProfiles = ['stagingEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
		});

		it('should use document when multiple doc.profiles match active profiles', async function() {
			const doc: Document = {'profiles': 'devEast,devWest,stagingEast'};
			let activeProfiles: string[] = ['devEast','devWest'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			activeProfiles = ['devWest','stagingEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			activeProfiles = ['stagingEast','devEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
		});

		it('should NOT use document when not operator used in doc.profiles for active profile', async function() {
			const doc: Document = {'profiles': 'devEast,!devWest,stagingEast'};
			let activeProfiles: string[] = ['devEast','devWest'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
			activeProfiles = ['devWest','stagingEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), false);
		});

		it('should use document when not operator used in doc.profiles for non-active profile', async function() {
			let doc: Document = {'profiles': 'devEast,devWest,!stagingEast'};
			let activeProfiles: string[] = ['devEast','devWest'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			doc = {'profiles': 'devEast,!devWest,stagingEast'};
			activeProfiles = ['devEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
			doc = {'profiles': '!devEast,devWest,stagingEast'};
			activeProfiles = ['devWest','stagingEast'];
			assert.deepEqual(shouldUseDocument(doc, activeProfiles), true);
		});

	});

});