/*jshint esversion: 8 */

// Import the function to be tested
import {oqlToQuery, queryToOQL} from '../oqlParse/oqlParse.js';
import CryptoJS from 'crypto-js';


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

function objectMD5(obj) {
    const jsonString = JSON.stringify(obj);
    return CryptoJS.MD5(jsonString).toString();
}

class OQOTestRunner {
    constructor(tests, onTestResultCb) {
        this.onTestResultCb = onTestResultCb;
        this.tests = tests;
    }

    static queriesEqual(generatedOQO, expectedOQO, path = '') {
        function createDifference(prop, value1, value2) {
            return {
                equal: false,
                difference_path: `${path}${prop}`,
                expected: JSON.stringify(value2),
                actual: JSON.stringify(value1)
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
                    JSON.stringify(filter1.value) === JSON.stringify(filter2.value);
            } else if (filter1.type === 'branch') {
                return filter1.children.length === filter2.children.length;
            }

            return false;
        }

        // Handle empty objects
        if (Object.keys(generatedOQO).length === 0 && Object.keys(expectedOQO).length === 0) {
            return {equal: true};
        }

        // Compare non-filter properties
        const properties = ['summarize', 'summarize_by', 'sort_by', 'return'];
        for (const prop of properties) {
            if (prop in generatedOQO || prop in expectedOQO) {
                if (JSON.stringify(generatedOQO[prop]) !== JSON.stringify(expectedOQO[prop])) {
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

    static runOQLToOQOFunc(oql, expectedQuery) {
        try {
            const generatedOQO = oqlToQuery(oql);
            const result = OQOTestRunner.queriesEqual(generatedOQO, expectedQuery);
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
                },
            };
        }
    }

    static runOQOToOQLFunc(expectedQuery) {
        try {
            const generatedOQL = queryToOQL(expectedQuery);
            const queryFromGeneratedOQL = oqlToQuery(generatedOQL);
            const result = OQOTestRunner.queriesEqual(queryFromGeneratedOQL, expectedQuery);
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
                },
            };
        }
    }

    static async getNatLangQuery(prompt) {
        const params = new URLSearchParams({
            natural_language: prompt,
        });
        const fullUrl = `${natLangUrl}?${params.toString()}`;
        const response = await fetch(fullUrl);
        if (!response.ok) {
            throw new Error(`Bad status fetching natural language response: ${response.status} - (${fullUrl})`);
        }
        return await response.json();
    }

    static async runNatLangFunc(natLangPrompts, expectedQuery) {
        let results = [];
        for (const prompt of natLangPrompts) {
            try {
                const oqo = await OQOTestRunner.getNatLangQuery(prompt);
                const result = OQOTestRunner.queriesEqual(oqo, expectedQuery);
                results.push({
                    "case": "natLang",
                    isPassing: result.equal,
                    details: result,
                });
            } catch (e) {
                results.push({
                    "case": "natLang",
                    isPassing: false,
                    details: {
                        error: e.message,
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

    static async runSearchFunc(query, timeout) {

        async function createSearchGetID(q) {
            const response = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(q),
            });
            if (!response.ok) {
                throw new Error(`Bad status when creating search: ${response.status} - ${JSON.stringify(q)}`);
            }
            const j = await response.json();
            return j.id;
        }

        async function getSearchState(id) {
            const url = `${searchUrl}/${id}`;
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
            const searchId = await createSearchGetID(query);
            const {
                result,
                elapsedTime
            } = pollSearchUntilReady(searchId, timeout);
            const testResult = {
                "case": "queryToSearch",
                isPassing: true,
                details: {
                    id: result.id,
                    elapsedTime,
                    resultsCount: result.details.count,
                }
            };
            if (result.details.count === 0) {
                result.details.error = "no results";
            }
            return testResult;
        } catch (e) {
            return {
                "case": "queryToSearch",
                isPassing: false,
                details: {
                    error: "timeout"
                }
            };
        }
    }

    async runAllTests() {
        const testPromises = this.tests.map(async (test) => {
            const testId = objectMD5(test);

            // Run OQL to Query test
            const oqlToQueryResult = OQOTestRunner.runOQLToOQOFunc(test.oql, test.query);
            oqlToQueryResult.id = testId;
            this.onTestResultCb(oqlToQueryResult);

            // Run Query to OQL test
            const queryToOqlResult = OQOTestRunner.runOQOToOQLFunc(test.query);
            queryToOqlResult.id = testId;
            this.onTestResultCb(queryToOqlResult);

            // Run Natural Language test if applicable
            if ('natLang' in test && Array.isArray(test.natLang) && test.natLang.length > 0) {
                const natLangResult = await OQOTestRunner.runNatLangFunc(test.natLang, test.query);
                natLangResult.id = testId;
                this.onTestResultCb(natLangResult);
            }

            // Run Search test
            let searchTimeout = 30000;
            if ('searchTimeout' in test) {
                searchTimeout = test.searchTimeout;
                // convert to ms if in seconds
                if (searchTimeout < 1000) {
                    searchTimeout *= 1000;
                }
            }
            const searchResult = await OQOTestRunner.runSearchFunc(test.query, searchTimeout);
            searchResult.id = testId;
            this.onTestResultCb(searchResult);
        });

        // Wait for all tests to complete
        await Promise.all(testPromises);
    }
}
