/*jshint esversion: 6 */

import {getConfigs} from "../oaxConfigs.js";

function makeColumnIDsMap() {
    const map = {};
    let configs = getConfigs();
    for (const key in configs) {
        map[configs[key].filterName] = configs[key].filterKey;
    }
    return map;
}

const COLUMN_IDS_MAP = makeColumnIDsMap();

function generateId(prefix = "leaf") {
    return `${prefix}_${Math.random().toString(36).substr(2, 8)}`;
}

function parseCondition(condition, subjectEntity) {
    let match = condition.match(/(\S+)\s+(is not|is|contains|does not contain)\s+(.+)/);
    if (match) {
        let column_id = match[1];
        if (column_id in COLUMN_IDS_MAP) {
            column_id = COLUMN_IDS_MAP[column_id];
        }
        let operator = match[2];
        let value = match[3].replace(/;/g, '').trim();
        let values = value.split(',').map(val => {
            if (val.match(/^\d+$/)) {
                return parseInt(val, 10);
            } else if (val.startsWith("'") && val.endsWith("'")) {
                return val.slice(1, -1);
            }
            return val;
        }).filter(val => val !== '');

        return {
            id: generateId(),
            subjectEntity,
            type: "leaf",
            operator,
            column_id,
            value: values
        };
    }
    return null;
}

function parseFilters(oql) {
    const filters = [];
    const worksConditions = [];
    let summarizeByCondition = null;
    let summarizeByEntity = null;
    let worksOperator = "and";
    let summarizeByOperator = "and";

    const worksMatch = oql.match(/where (.+?)(;|$)/);
    if (worksMatch) {
        const worksClause = worksMatch[1];
        if (worksClause.includes(" or ")) {
            worksOperator = "or";
            worksConditions.push(...worksClause.split(" or "));
        } else {
            worksConditions.push(...worksClause.split(" and "));
        }
    }

    const summarizeByMatch = oql.match(/summarize by (\w+) where (.+?)(;|$)/);
    if (summarizeByMatch) {
        summarizeByEntity = summarizeByMatch[1];
        summarizeByCondition = summarizeByMatch[2];
        if (summarizeByCondition.includes(" or ")) {
            summarizeByOperator = "or";
        }
    }

    const worksBranchId = generateId("br");
    const worksBranchChildren = [];

    worksConditions.forEach(condition => {
        const leaf = parseCondition(condition.trim(), "works");
        if (leaf) {
            filters.push(leaf);
            worksBranchChildren.push(leaf.id);
        }
    });

    if (worksBranchChildren.length > 0) {
        filters.push({
            id: worksBranchId,
            subjectEntity: "works",
            type: "branch",
            operator: worksOperator,
            children: worksBranchChildren,
            isRoot: true
        });
    }

    if (summarizeByMatch) {
        const summarizeByBranchId = generateId("br");
        const summarizeByLeaves = summarizeByCondition.split(summarizeByOperator === "or" ? " or " : " and ")
            .map(condition => parseCondition(condition.trim(), summarizeByEntity))
            .filter(leaf => leaf !== null);

        filters.push(...summarizeByLeaves);

        if (summarizeByLeaves.length > 0) {
            filters.push({
                id: summarizeByBranchId,
                subjectEntity: summarizeByEntity,
                type: "branch",
                operator: summarizeByOperator,
                children: summarizeByLeaves.map(leaf => leaf.id),
                isRoot: true
            });
        }
    }

    return filters;
}

function oqlToQuery(oql) {
    oql = oql.replace(/^get works\s*/, '').trim();

    if (oql === '') {
        return {};
    }

    const query = {};

    if (oql.includes("summarize")) {
        query.summarize = true;
    }

    if (oql.includes("return")) {
        const returnMatch = oql.match(/return (.+?)(;|$)/);
        if (returnMatch) {
            query.return = returnMatch[1].split(',').map(item => item.trim());
        }
    }

    if (oql.includes("summarize by")) {
        const summarizeByMatch = oql.match(/summarize by (.*?)(?:where|;|$)/);
        if (summarizeByMatch) {
            query.summarize_by = summarizeByMatch[1].trim();
        }
    }

    if (oql.includes("sort by")) {
        const sortByMatch = oql.match(/sort by (\w+) (asc|desc)/);
        if (sortByMatch) {
            let column_id = sortByMatch[1];
            if (column_id in COLUMN_IDS_MAP) {
                column_id = COLUMN_IDS_MAP[column_id];
            }
            query.sort_by = {
                column_id: column_id,
                direction: sortByMatch[2]
            };
        }
    }

    if (oql.includes("where")) {
        query.filters = parseFilters(oql);
    }

    return query;
}
// this seems to break for me? not sure why.
// module.exports = oqlToQuery;

export {
    oqlToQuery
};