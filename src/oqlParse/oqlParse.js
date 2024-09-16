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

function generateFilters(filters) {
    return filters.map(filter =>
        `${filter.column_id} ${filter.operator ?? 'is'} ${filter.value}`
    ).join(' and ');
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
        const filters = parseFilters(whereClause[1], query.get_rows);
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
        oql += `using works where ${generateFilters(query.filter_works)}; `;
    }

    oql += `get ${query.get_rows}`;

    if (query.get_rows === 'summary') {
        oql += ' of works';
    }

    if (filterWorks.length > 0 && query.get_rows === 'works') {
        oql += ` where ${generateFilters(query.filter_works)}`;
    }

    const filterAggs = query.filter_aggs ?? [];

    if (filterAggs.length > 0 && query.get_rows !== 'works') {
        oql += ` where ${generateFilters(query.filter_aggs)}`;
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

    return str;
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

function parseFilters(filterString, filterType) {
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