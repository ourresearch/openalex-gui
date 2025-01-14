/*jshint esversion: 11 */

import {getConfigs} from "../oaxConfigs.js";


function makeColumnIDsMap() {
    const map = {};
    let configs = getConfigs();
    for (const key in configs) {
        const columns = [];
        for (const colKey in configs[key].columns) {
            columns.push(
                {
                    name: configs[key].columns[colKey].displayName.toLowerCase(),
                    id: configs[key].columns[colKey].id,
                    entityId: configs[key].columns[colKey].entityId
                }
            );
        }
        map[key] = columns;
    }
    return map;
}

const COLUMN_IDS_MAP = makeColumnIDsMap();


function generateFilters(filters, join) {
    return filters.map(filter => {
        if (filter["join"]) {
            return `(${generateFilters(filter["filters"], filter["join"])})`;
        }

        let value = filter.value;

        // Check if value is a string and contains a space
        if (typeof value === 'string' && value.includes(' ')) {
            value = `"${value}"`;
        }
        return `${filter.column_id} ${filter.operator ?? 'is'} ${value}`;
    }).join(` ${join} `);
}


function oqlToQuery(oql) {
    oql = oql.trim();
    const query = {};

    let getRowsMatch = oql.match(/^(?:using works where .+?;\s*)?get\s+([\w-]+)(?:\s+of\s+works)?/);
    if (getRowsMatch) {
        query.get_rows = getRowsMatch[1];
        if (query.get_rows === "a" && oql.includes("summary of works")) {
            query.get_rows = "summary";
        }
    } else {
        throw new Error("Invalid OQL: missing 'get' statement");
    }

    const workFilters = [];
    const aggFilters = [];

    const usingWorksMatch = oql.match(/using works where (.+?);/);
    if (usingWorksMatch) {
        workFilters.push(...parseFilters(usingWorksMatch[1], 'works'));
    }

    const whereClause = oql.match(/get .+?(?:of works)?(?:\s+where\s+(.*?)(?:;|$))/);
    if (whereClause) {
        console.log("whereClause: " + whereClause[1])
        const filters = parseFilters(whereClause[1], query.get_rows);
        console.log("filters")
        console.log(filters)
        if (query.get_rows === 'works') {
            workFilters.push(...filters);
        } else {
            aggFilters.push(...filters);
        }
    }

    if (workFilters.length > 0) {
        query.filter_works = workFilters;
    }
    if (aggFilters.length > 0) {
        query.filter_aggs = aggFilters;
    }

    const sortMatch = oql.match(/sort by\s+([\w().]+)\s+(asc|desc)/);
    if (sortMatch) {
        query.sort_by_column = getColumnId(sortMatch[1], query.get_rows);
        query.sort_by_order = sortMatch[2];
    }

    const showMatch = oql.match(/show\s+(.*?)(?:;|$)/);
    if (showMatch) {
        query.show_columns = showMatch[1].split(',').map(col => getColumnId(col.trim(), query.get_rows));
    }

    return query;
}


function queryToOQL(query) {
    let oql = '';
    const filterWorks = query.filter_works ?? [];

    if (filterWorks.length > 0 && query.get_rows !== 'works') {
        oql += `using works where ${generateFilters(query.filter_works, "and")}; `;
    }

    oql += `get ${query.get_rows}`;

    if (query.get_rows === 'summary') {
        oql += ' of works';
    }

    if (filterWorks.length > 0 && query.get_rows === 'works') {
        oql += ` where ${generateFilters(query.filter_works, "and")}`;
    }

    const filterAggs = query.filter_aggs ?? [];

    if (filterAggs.length > 0 && query.get_rows !== 'works') {
        oql += ` where ${generateFilters(query.filter_aggs, "and")}`;
    }

    if (query.sort_by_column && query.sort_by_order) {
        oql += `; sort by ${query.sort_by_column} ${query.sort_by_order}`;
    }

    if (query.show_columns && query.show_columns.length > 0) {
        oql += `; show ${query.show_columns.join(', ')}`;
    }
    oql += ';';
    return oql.trim();
}


function parsePrimitive(str) {
    str = str.trim();

    if (str.toLowerCase() === 'true') {
        return true;
    } else if (str.toLowerCase() === 'false') {
        return false;
    }

    if (/^\d+$/.test(str)) {
        const num = parseFloat(str);
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
    }
     // strip quotes from either side of string
    return str.replace(/^"(.*)"$/, '$1');
}


function getColumnId(name, subjectEntity = "works") {
    name = name.toLowerCase();
    if (!(subjectEntity in COLUMN_IDS_MAP)) {
        throw new Error(`${subjectEntity} is not a valid subjectEntity`);
    }
    for (const m of COLUMN_IDS_MAP[subjectEntity]) {
        if (name === m.name || name === m.id) return name;
    }
    throw new Error(`${subjectEntity}.${name} is not a valid column`);
}


function XparseFilters(filterString, filterType) {
    return filterString.split(' and ').map(filter => {
        const match = filter.match(/(\w+(?:\.\w+)*)\s+(is not|is greater than or equal to|>=|is less than or equal to|<=|is greater than|>|is less than|<|contains|does not contain|is in|is not in|is)\s+(.+)/);
        if (match) {
            const [, column_id, operator, value] = match;
            const filter = {
                column_id: getColumnId(column_id, filterType),
                ...(operator !== 'is' && { operator: operator }),
                value: parsePrimitive(value)
            };
            return filter;
        } else {
            throw new Error(`Invalid filter: ${filter}`);
        }
    });
}

function parseFilters(filterString, filterType) {
    /**
     * Written by GPT4.0 with onlu light edits - BLL
     * Parses a filter string into an array of filter objects.
     * Handles parentheses, nested groups, and default joins (`and`/`or`).
     */

    // Helper to parse a single filter
    function parsePrimitiveFilter(filter) {
        const match = filter.match(/(\w+(?:\.\w+)*)\s+(is not|is greater than or equal to|>=|is less than or equal to|<=|is greater than|>|is less than|<|contains|does not contain|is in|is not in|is)\s+(.+)/);
        if (!match) throw new Error(`Invalid filter: ${filter}`);
        const [, column_id, operator, value] = match;
        return {
            column_id: getColumnId(column_id, filterType),
            ...(operator !== "is" ? { operator } : {}),
            value: parsePrimitive(value),
        };
    }

    // Helper to parse groups (nested filters)
    function parseNestedFilters(str) {
        const stack = [];
        let current = { join: "and", filters: [] };
        let buffer = "";

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === "(") {
                if (buffer.trim()) {
                    current.filters.push(parsePrimitiveFilter(buffer.trim()));
                    buffer = "";
                }
                const newGroup = { join: "and", filters: [] };
                stack.push(current);
                current = newGroup;
            } else if (char === ")") {
                if (buffer.trim()) {
                    current.filters.push(parsePrimitiveFilter(buffer.trim()));
                    buffer = "";
                }
                const completedGroup = current;
                current = stack.pop();
                current.filters.push(completedGroup);
            } else if (str.slice(i, i + 4).toLowerCase() === " and") {
                if (buffer.trim()) {
                    current.filters.push(parsePrimitiveFilter(buffer.trim()));
                    buffer = "";
                }
                current.join = "and";
                i += 3;
            } else if (str.slice(i, i + 3).toLowerCase() === " or") {
                if (buffer.trim()) {
                    current.filters.push(parsePrimitiveFilter(buffer.trim()));
                    buffer = "";
                }
                current.join = "or";
                i += 2;
            } else {
                buffer += char;
            }
        }

        if (buffer.trim()) {
            current.filters.push(parsePrimitiveFilter(buffer.trim()));
        }

        // Simplify if the group only contains a single filter
        return current.filters.length === 1 && current.filters[0].join
            ? current.filters[0]
            : current;
    }

    // Main logic
    filterString = filterString.trim();

    if (filterString.startsWith("(")) {
        // Parse the entire input as a grouped filter
        const parsedGroup = parseNestedFilters(filterString);
        return [parsedGroup];
    }

    // Parse as a flat list of filters
    const flatFilters = filterString.split(" and ").map(filter => parsePrimitiveFilter(filter.trim()));
    return flatFilters;
}



function validateOql(oql, returnError=false) {
    const endTermsBlacklist = ['and', 'where', 'or', 'is', 'not', 'show', 'using', 'sort', 'by'];
    const badTrailingTerm = endTermsBlacklist.find(substring => oql.endsWith(substring)) || null;
    if (badTrailingTerm) {
        if (returnError) {
            return `Malformed OQL`;
        } else return false;
    }
    try {
        oqlToQuery(oql);
        return true;
    } catch (error) {
        if (returnError) return error.message;
        return false;
    }
}


export {
    oqlToQuery,
    queryToOQL,
    validateOql
};