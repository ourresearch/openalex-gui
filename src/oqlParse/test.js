/*jshint esversion: 6 */

// Import the function to be tested
import { oqlToQuery, queryToOQL } from '../oqlParse/oqlParse.js';

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use __dirname as in CommonJS
const testsFilePath = path.join(__dirname, 'tests.json');
const testCases = JSON.parse(fs.readFileSync(testsFilePath, 'utf8'));

function queriesEqual(query1, query2, path = '') {
  function logDifference(prop, value1, value2) {
    console.log(`Difference at ${path}${prop}:`);
    console.log(`  Query 1: ${JSON.stringify(value1)}`);
    console.log(`  Query 2: ${JSON.stringify(value2)}`);
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
        logDifference(`${filterPath}unmatched filter`, filter1, null);
        return false;
      }
    }

    if (queue1.length > 0 || queue2.length > 0) {
      logDifference(`${filterPath}remaining filters`, queue1, queue2);
      return false;
    }

    return true;
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
  if (Object.keys(query1).length === 0 && Object.keys(query2).length === 0) {
    return true;
  }

  // Compare non-filter properties
  const properties = ['summarize', 'summarize_by', 'sort_by', 'return'];
  for (const prop of properties) {
    if (prop in query1 || prop in query2) {
      if (JSON.stringify(query1[prop]) !== JSON.stringify(query2[prop])) {
        logDifference(prop, query1[prop], query2[prop]);
        return false;
      }
    }
  }

  // Compare filters
  if ('filters' in query1 || 'filters' in query2) {
    if (!query1.filters || !query2.filters || query1.filters.length !== query2.filters.length) {
      logDifference('filters', query1.filters, query2.filters);
      return false;
    }

    // Find root filters
    const rootFilters1 = findRootFilters(query1.filters);
    const rootFilters2 = findRootFilters(query2.filters);

    if (rootFilters1.length !== rootFilters2.length) {
      logDifference('root filters count', rootFilters1.length, rootFilters2.length);
      return false;
    }

    // Compare all filters
    return compareFilters(query1.filters, query2.filters, 'filters.');
  }

  return true;
}
// Run the tests
testCases.forEach((testCase, index) => {
    const { oql, query: expectedQuery } = testCase;
    let generatedQuery;
    let generatedOQL;
    let queryFromGeneratedOQL;

    try {
        generatedOQL = queryToOQL(expectedQuery);

        queryFromGeneratedOQL = oqlToQuery(generatedOQL);
        if (queriesEqual(queryFromGeneratedOQL, expectedQuery)) {
            console.log(`[Query -> OQL] Test case ${index + 1} passed.`);
        } else {
            throw new Error('[Query -> OQL] Objects are not equal');
        }
    } catch (error) {
        console.error(`[Query -> OQL] Test case ${index + 1} failed.`);
        console.error(`[Query -> OQL] OQL: ${oql}`);
        console.error(`[Query -> OQL] Expected: ${JSON.stringify(expectedQuery, null, 2)}`);
        console.error(`[Query -> OQL] Generated: ${JSON.stringify(generatedQuery, null, 2)}`);
        console.error(`[Query -> OQL] Error: ${error.message}`);
    }

    try {
        generatedQuery = oqlToQuery(oql);

        if (queriesEqual(generatedQuery, expectedQuery)) {
            console.log(`[OQL -> Query] Test case ${index + 1} passed.`);
        } else {
            throw new Error('[OQL -> Query] Objects are not equal');
        }

    } catch (error) {
        console.error(`[OQL -> Query] Test case ${index + 1} failed.`);
        console.error(`[OQL -> Query] OQL: ${oql}`);
        console.error(`[OQL -> Query] Expected: ${JSON.stringify(expectedQuery, null, 2)}`);
        console.error(`[OQL -> Query] Generated: ${JSON.stringify(generatedQuery, null, 2)}`);
        console.error(`[OQL -> Query] Error: ${error.message}`);
    }
});