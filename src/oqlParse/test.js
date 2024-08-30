/*jshint esversion: 11 */

// Import the function to be tested
import {oqlToQuery, queryToOQL} from '../oqlParse/oqlParse.js';
import {objectMD5ShortUUID} from '../oqlParse/util.js';


const testsJsonUrl = "https://raw.githubusercontent.com/ourresearch/oqo-search-tests/main/tests.json";
const natLangUrl = "https://api.openalex.org/text/oql";
const searchUrl = "https://api.openalex.org/searches";

async function getTests() {
    const response = await fetch(testsJsonUrl);
    if (!response.ok) {
        throw new Error(`Bad status fetching tests json: ${response.status}`);
    }
    return await response.json();
}

class OQOTestRunner {
    constructor(tests, onTestResultCb) {
        this.onTestResultCb = onTestResultCb;
        this.tests = tests;
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
                filter1.operator !== filter2.operator) {
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

    static async getNatLangQuery(prompt) {
        const params = new URLSearchParams({
            natural_language: prompt,
            mailto: 'team@ourresearch.org'
        });
        const fullUrl = `${natLangUrl}?${params.toString()}`;
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Bad status fetching natural language response: ${response.status} - (${fullUrl})`);
        }
        return await response.json();
    }

    static async runNatLangFunc(test) {
        let results = [];
        for (const prompt of test.natLang ?? []) {
            try {
                const oqo = await OQOTestRunner.getNatLangQuery(prompt);
                const result = OQOTestRunner.queriesEqual(oqo, test.query, test.ignore ?? []);
                if (!result.equal) {
                    result.expected = test.query;
                    result.actual = oqo;
                }
                results.push({
                    "case": "natLang",
                    prompt,
                    isPassing: result.equal,
                    details: result,
                });
            } catch (e) {
                results.push({
                    "case": "natLang",
                    prompt,
                    isPassing: false,
                    details: {
                        error: e.message,
                        expected: test.query,
                        actual: null
                    }
                });
            }
        }
        return {
            "case": "natLang",
            isPassing: results.every((o) => o.isPassing),
            subTests: results
        };
    }

    static async runSearchFunc(test) {

        async function createSearchGetID(q) {
            const response = await fetch(searchUrl + '?mailto=team@ourresearch.org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({query: q}),
            });
            if (!response.ok) {
                throw new Error(`Bad status when creating search: ${response.status} - ${JSON.stringify(q)}`);
            }
            const j = await response.json();
            return j.id;
        }

        async function getSearchState(id) {
            const url = `${searchUrl}/${id}?mailto=team@ourresearch.org`;
            return fetch(url).then(res => res.json());
        }

        async function pollSearchUntilReady(id, timeout) {
            const pollingInterval = 1000;
            const startTime = Date.now();

            while (true) {
                const result = await getSearchState(id);

                if (result.is_ready) {
                    const elapsedTime = Date.now() - startTime;
                    return {result, elapsedTime};
                }

                if (Date.now() - startTime >= timeout) {
                    throw new Error('Timeout occurred while waiting for search to be ready.');
                }

                // Wait for the specified polling interval before checking again
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }
        }

        try {
            const searchId = await createSearchGetID(test.query);
            let timeout = test.searchTimeout ?? 30000;
            if (timeout < 1000) {
                timeout *= 1000;
            }
            const {
                result,
                elapsedTime
            } = await pollSearchUntilReady(searchId, timeout);
            const testResult = {
                "case": "queryToSearch",
                isPassing: result.results.length > 0,
                details: {
                    searchId,
                    elapsedTime,
                    resultsCount: result.results.length,
                }
            };
            if (result.results.length === 0) {
                testResult.details.error = "no results";
                testResult.details.test = test;
            }
            return testResult;
        } catch (e) {
            return {
                "case": "queryToSearch",
                isPassing: false,
                details: {
                    error: e.message,
                }
            };
        }
    }

    async runTests(cases = ["oqlToQuery", "queryToOql", "natLang", "queryToSearch"]) {
        const testPromises = this.tests.map(async (test) => {
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

            if (cases.includes("queryToSearch")) {
                const searchResult = await OQOTestRunner.runSearchFunc(test);
                searchResult.id = testId;
                this.onTestResultCb(searchResult);
            }

            // Run Natural Language test if applicable
            if ('natLang' in test && Array.isArray(test.natLang) && test.natLang.length > 0 && cases.includes("natLang")) {
                const natLangResult = await OQOTestRunner.runNatLangFunc(test);
                natLangResult.id = testId;
                this.onTestResultCb(natLangResult);
            }

        });

        // Wait for all tests to complete
        await Promise.all(testPromises);
    }
}

export {
    getTests, OQOTestRunner
};
