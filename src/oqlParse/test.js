/*jshint esversion: 8 */

// Import the function to be tested
import {oqlToQuery, queryToOQL} from '../oqlParse/oqlParse.js';
import CryptoJS from 'crypto-js';

const testsJsonUrl = "https://raw.githubusercontent.com/ourresearch/oqo-search-tests/main/tests.json";
const natLangUrl = "https://api.openalex.org/text/oql";

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
        const generatedOQO = oqlToQuery(oql);
        const result = OQOTestRunner.queriesEqual(generatedOQO, expectedQuery);
        return {
            "case": "oqlToQuery",
            isPassing: result.equal,
            meta: result,
        };
    }

    static runOQOToOQLFunc(expectedQuery) {
        const generatedOQL = queryToOQL(expectedQuery);
        const queryFromGeneratedOQL = oqlToQuery(generatedOQL);
        const result= OQOTestRunner.queriesEqual(queryFromGeneratedOQL, expectedQuery);
        return {
            "case": "queryToOql",
            isPassing: result.equal,
            meta: result
        };
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
            const oqo = await OQOTestRunner.getNatLangQuery(prompt);
            const result = OQOTestRunner.queriesEqual(oqo, expectedQuery);
            results.push({
                "case": "natLang",
                isPassing: result.equal,
                meta: result,
            });
        }
        return {
            "case": "natLang",
            isPassing: results.every((o) => o.isPassing),
            subTests: results
        };
    }

    async runAllTests() {
        this.tests.forEach((test) => {
            const testId = objectMD5(test);
            const oqlToQueryResult = OQOTestRunner.runOQLToOQOFunc(test.oql, test.query);
            oqlToQueryResult.id = testId;
            this.onTestResultCb(oqlToQueryResult);
            const queryToOqlResult = OQOTestRunner.runOQOToOQLFunc(test.query);
            queryToOqlResult.id = testId;
            this.onTestResultCb(queryToOqlResult);
            if ('natLang' in test && Array.isArray(test.natLang) && test.natLang.length > 0) {
                const natLangResult = OQOTestRunner.runNatLangFunc(test.natLang, test.query);
                natLangResult.id = testId;
                this.onTestResultCb(natLangResult);
            }
        });
    }
}


const tests = await getTests();
const testRunner = new OQOTestRunner(tests, (test) => {
    console.log(test);
});
await testRunner.runAllTests();