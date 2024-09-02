/*jshint esversion: 11 */

// Import the function to be tested
import {oqlToQuery, queryToOQL} from '../oqlParse/oqlParse.js';
import {objectMD5ShortUUID} from '../oqlParse/util.js';


const testsJsonUrl = "https://raw.githubusercontent.com/ourresearch/oqo-search-tests/main/tests.json";

async function getTests() {
    const response = await fetch(testsJsonUrl);
    if (!response.ok) {
        throw new Error(`Bad status fetching tests json: ${response.status}`);
    }
    return await response.json();
}


class OQOTestRunner {
    constructor(tests, onTestResultCb) {
        this.tests = tests;
        this.onTestResultCb = onTestResultCb;
        this.serverUrl = 'https://api.openalex.org';
        this.queueId = null;
    }

    expectedResults(tests, cases = ["oqlToQuery", "queryToOql", "natLang", "queryToSearch"]) {
        let expectedResults = [];
        for (const test of tests) {
            for (const caseType of cases) {
                switch (caseType) {
                    case "oqlToQuery":
                    case "queryToOql":
                    case "queryToSearch":
                        expectedResults.push({
                            "case": caseType,
                            id: objectMD5ShortUUID(test),
                        });
                        break;
                    case "natLang":
                        if (test && typeof test === 'object' && 'natLang' in test && Array.isArray(test.natLang) && test.natLang.length > 0) {
                            expectedResults.push({
                                "case": "natLang",
                                id: objectMD5ShortUUID(test),
                            });
                        }
                        break;
                }
            }
        }
        return expectedResults;
    }


    static queriesEqual(generatedOQO, expectedOQO, ignoreProperties = [], path = '') {
        function createDifference(prop, value1, value2) {
            return {
                equal: false,
                difference_path: `${path}${prop}`,
                path_expected: value2,
                path_actual: value1
            };
        }

        function normalizeOperator(operator) {
            const operatorMap = {
                '<': 'is less than',
                '<=': 'is less than or equal to',
                '>': 'is greater than',
                '>=': 'is greater than or equal to',
                '=': 'is',
                '!=': 'is not'
            };
            return operatorMap[operator] || operator;
        }

        function findRootFilters(filters) {
            const childIds = new Set(filters.flatMap(filter => filter.children || []));
            return filters.filter(filter => !childIds.has(filter.id));
        }

        function compareFilters(filters1, filters2, filterPath) {
            const queue1 = [...filters1];
            const queue2 = [...filters2];

            while (queue1.length > 0 && queue2.length > 0) {
                const filter1 = queue1.shift();
                let matchFound = false;

                for (let i = 0; i < queue2.length; i++) {
                    const filter2 = queue2[i];

                    if (filtersMatch(filter1, filter2)) {
                        queue2.splice(i, 1);
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    return createDifference(`${filterPath}unmatched filter`, filter1, null);
                }
            }

            if (queue1.length > 0 || queue2.length > 0) {
                return createDifference(`${filterPath}remaining filters`, queue1, queue2);
            }

            return {equal: true};
        }

        function filtersMatch(filter1, filter2) {
            if (filter1.type !== filter2.type ||
                filter1.subjectEntity !== filter2.subjectEntity ||
                normalizeOperator(filter1.operator) !== normalizeOperator(filter2.operator)) {
                return false;
            }


            if (filter1.type === 'leaf') {
                return filter1.column_id === filter2.column_id &&
                    areValuesEqual(filter1.value, filter2.value);
            } else if (filter1.type === 'branch') {
                return filter1.children.length === filter2.children.length;
            }

            return false;
        }

        function areValuesEqual(value1, value2) {
            if (value1 === value2) return true;

            const isNullOrUndefined = (val) => val === null || val === undefined;
            const isEmptyArray = (val) => Array.isArray(val) && val.length === 0;

            if (isNullOrUndefined(value1) || isEmptyArray(value1)) {
                return isNullOrUndefined(value2) || isEmptyArray(value2);
            }

            if (isNullOrUndefined(value2) || isEmptyArray(value2)) {
                return isNullOrUndefined(value1) || isEmptyArray(value1);
            }
            if (typeof value1 === 'number' && typeof value2 === 'string' ||
                typeof value1 === 'string' && typeof value2 === 'number') {
                return Number(value1) === Number(value2);
            }

            return JSON.stringify(value1) === JSON.stringify(value2);
        }

        // Handle empty objects
        if (Object.keys(generatedOQO).length === 0 && Object.keys(expectedOQO).length === 0) {
            return {equal: true};
        }

        // Compare non-filter properties
        const properties = ['summarize', 'summarize_by', 'sort_by', 'return_columns'];
        for (const prop of properties) {
            if (!ignoreProperties.includes(prop) && (prop in generatedOQO || prop in expectedOQO)) {
                if (!areValuesEqual(generatedOQO[prop], expectedOQO[prop])) {
                    return createDifference(prop, generatedOQO[prop], expectedOQO[prop]);
                }
            }
        }

        // Compare filters
        if ('filters' in generatedOQO || 'filters' in expectedOQO) {
            if (!generatedOQO.filters || !expectedOQO.filters || generatedOQO.filters.length !== expectedOQO.filters.length) {
                return createDifference('filters', generatedOQO.filters, expectedOQO.filters);
            }

            // Find root filters
            const rootFilters1 = findRootFilters(generatedOQO.filters);
            const rootFilters2 = findRootFilters(expectedOQO.filters);

            if (rootFilters1.length !== rootFilters2.length) {
                return createDifference('root filters count', rootFilters1.length, rootFilters2.length);
            }

            // Compare all filters
            return compareFilters(generatedOQO.filters, expectedOQO.filters, 'filters.');
        }

        return {equal: true};
    }

    static runOQLToOQOFunc(test) {
        try {
            const generatedOQO = oqlToQuery(test.oql);
            const result = OQOTestRunner.queriesEqual(generatedOQO, test.query, test.ignore ?? []);
            if (!result.equal) {
                result.expected = test.query;
                result.actual = generatedOQO;
            }
            return {
                "case": "oqlToQuery",
                isPassing: result.equal,
                details: result,
            };
        } catch (e) {
            return {
                "case": "oqlToQuery",
                isPassing: false,
                details: {
                    error: e.message,
                    expected: test.query,
                    actual: null
                },
            };
        }
    }

    static runOQOToOQLFunc(test) {
        try {
            const generatedOQL = queryToOQL(test.query);
            const queryFromGeneratedOQL = oqlToQuery(generatedOQL);
            const result = OQOTestRunner.queriesEqual(queryFromGeneratedOQL, test.query, test.ignore ?? []);
            if (!result.equal) {
                result.expected = test.oql;
                result.actual = generatedOQL;
            }
            return {
                "case": "queryToOql",
                isPassing: result.equal,
                details: result
            };
        } catch (e) {
            return {
                "case": "queryToOql",
                isPassing: false,
                details: {
                    error: e.message,
                    expected: test.oql,
                    actual: null
                },
            };
        }
    }

    async startServerTests(cases) {
        const serverTests = this.tests.flatMap(test => {
            const testId = objectMD5ShortUUID(test);
            const serverTestCases = [];

            if (test.query && cases.includes("queryToSearch")) {
                serverTestCases.push({
                    test_id: testId,
                    query: test.query
                });
            }

            if (test.hasOwnProperty("natLang") && test.natLang !== null && cases.includes("natLang")) {
                test.natLang.forEach(prompt => {
                    serverTestCases.push({
                        test_id: testId,
                        prompt: prompt
                    });
                });
            }

            return serverTestCases;
        });

        const response = await fetch(`${this.serverUrl}/bulk_test`, {
            method: 'POST',
            body: JSON.stringify(serverTests),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.queueId = data.queue_id;
    }

    listenForResults() {
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(`${this.serverUrl}/stream/${this.queueId}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.status === 'processing') {
                    // Optionally handle processing status
                    return;
                }
                if (data.status === 'all_completed') {
                    eventSource.close();
                    resolve();
                    return;
                }
                if (data.status === 'error') {
                    console.error(data.message);
                    eventSource.close();
                    reject(new Error(data.message));
                    return;
                }

                if (data.hasOwnProperty('id') && data.id !== null) {
                    if (data.case === 'natLang') {
                        const results = [];
                        const test = this.tests.find(test => objectMD5ShortUUID(test) === data.id);
                        for (const _result of data.results) {
                            const result = OQOTestRunner.queriesEqual(_result.oqo, test.query, test.ignore ?? []);
                            if (!result.equal) {
                                result.expected = test.query;
                                result.actual = _result.oqo;
                            }
                            results.push({
                                "case": "natLang",
                                prompt: _result.prompt,
                                isPassing: result.equal,
                                details: result,
                            });
                        }
                        this.onTestResultCb({
                            "case": "natLang",
                            id: data.id,
                            isPassing: results.every((o) => o.isPassing),
                            subTests: results
                        });
                    } else if (data.case === 'jsonToSearch') {
                        this.onTestResultCb(data);
                    }
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource failed:', error);
                eventSource.close();
                reject(error);
            };
        });
    }

    async runTests(cases = ["oqlToQuery", "queryToOql", "natLang", "queryToSearch"]) {
        // Run client-side tests
        for (const test of this.tests) {
            const testId = objectMD5ShortUUID(test);

            if (cases.includes("oqlToQuery")) {
                const oqlToQueryResult = OQOTestRunner.runOQLToOQOFunc(test);
                oqlToQueryResult.id = testId;
                this.onTestResultCb(oqlToQueryResult);
            }

            if (cases.includes("queryToOql")) {
                const queryToOqlResult = OQOTestRunner.runOQOToOQLFunc(test);
                queryToOqlResult.id = testId;
                this.onTestResultCb(queryToOqlResult);
            }
        }

        // Run server-side tests
        if (cases.includes("natLang") || cases.includes("queryToSearch")) {
            await this.startServerTests(cases);
            await this.listenForResults();
        }
    }
}

export {
    getTests, OQOTestRunner
};
