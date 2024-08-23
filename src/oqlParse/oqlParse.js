/*jshint esversion: 6 */

import {getConfigs} from "../oaxConfigs.js";

function makeColumnIDsMap() {
    const map = {};
    let configs = getConfigs();
    for (const key in configs) {
        const columns = [];
        for (const colKey in configs[key].columns) {
            columns.push({[configs[key].columns[colKey].displayName.toLowerCase()]: configs[key].columns[colKey].id});
        }
        map[key] = columns;
    }
    return map;
}

const COLUMN_IDS_MAP = makeColumnIDsMap();


function getColumnId(name, subjectEntity = "works") {
    name = name.toLowerCase();
    if (!(subjectEntity in COLUMN_IDS_MAP)) {
        throw new Error(`${subjectEntity} is not a valid subjectEntity`);
    }
    for (const pair of COLUMN_IDS_MAP[subjectEntity]) {
        const value = Object.values(pair)[0];
        if (name in pair) return pair[name];
        else if (value === name) return value;
    }
    throw new Error(`${subjectEntity}.${name} is not a valid column`);
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

function generateId(prefix = "leaf") {
    return `${prefix}_${Math.random().toString(36).substr(2, 8)}`;
}

function parseCondition(condition, subjectEntity) {
    // Remove unnecessary parentheses and split based on the first matching operator
    condition = condition.trim().replace(/^\((.*?)\)$/, '$1');

    let match = condition.match(/^(\S+)\s+(is not|is greater than|is less than|contains|does not contain|is in|is not in|is)\s+(.+)$/);
    if (match) {
        let columnName = match[1].trim();
        let columnId = getColumnId(columnName, subjectEntity);

        let operator = match[2].trim();
        let value = match[3].trim().replace(/^\((.*?)\)$/, '$1').replace(/;/g, '');

        value = parsePrimitive(value);

        return {
            id: generateId(),
            subjectEntity,
            type: "leaf",
            operator,
            columnId: columnId,
            value
        };
    }
    return null;
}

function parseNestedConditions(expression) {
    let index = 0;
    const nodes = [];

    function parse() {
        const currentNode = {
            id: generateId('br'),
            operator: null,
            children: []
        };

        let buffer = '';

        function addBufferAsLeaf() {
            if (buffer.trim()) {
                const parsedCondition = parseCondition(buffer.trim());
                const leafNode = {
                    id: generateId('leaf'),
                    ...parsedCondition
                };
                nodes.push(leafNode);
                currentNode.children.push(leafNode.id);
                buffer = ''; // Clear the buffer after adding
            }
        }

        while (index < expression.length) {
            const char = expression[index];

            if (char === '(') {
                index++; // Skip the opening parenthesis
                const childBranch = parse();
                nodes.push(childBranch);
                currentNode.children.push(childBranch.id);
            } else if (char === ')') {
                addBufferAsLeaf();
                return currentNode;
            } else if (expression.substr(index, 3).toLowerCase() === ' or') {
                addBufferAsLeaf();
                currentNode.operator = 'or';
                index += 2; // Skip 'or'
            } else if (expression.substr(index, 4).toLowerCase() === ' and') {
                addBufferAsLeaf();
                currentNode.operator = 'and';
                index += 3; // Skip 'and'
            } else {
                buffer += char;
            }

            index++;
        }

        addBufferAsLeaf(); // Add any remaining condition in the buffer
        return currentNode;
    }

    parse();
    return nodes;
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
        if (worksClause.includes("(")) {
            let nestedConditions = parseNestedConditions(worksClause);
            for (const condition of nestedConditions) {
                condition.subjectEntity = 'work';
            }
            filters.push(...nestedConditions);
        }
        else if (worksClause.includes(" or ")) {
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
        } else {
            const branch = parseFilterExpression(condition.trim(), "works");
            if (branch) {
                filters.push(branch);
                worksBranchChildren.push(branch.id);
            }
        }
    });

    if (worksBranchChildren.length > 0) {
        filters.push({
            id: worksBranchId,
            subjectEntity: "works",
            type: "branch",
            operator: worksOperator,
            children: worksBranchChildren,
        });
    }

    if (summarizeByMatch) {
        if (summarizeByCondition !== null && summarizeByCondition.includes("(")) {
            let nestedConditions = parseNestedConditions(summarizeByCondition);
            for (const condition of nestedConditions) {
                condition.subjectEntity = summarizeByEntity;
            }
            filters.push(...nestedConditions);
        } else {
            const summarizeByBranchId = generateId("br");
            const summarizeByLeaves = summarizeByCondition.split(summarizeByOperator === "or" ? " or " : " and ")
                .map(condition => {
                    const leaf = parseCondition(condition.trim(), summarizeByEntity);
                    if (leaf) {
                        return leaf;
                    } else {
                        const branch = parseFilterExpression(condition.trim(), summarizeByEntity);
                        if (branch) {
                            return branch;
                        }
                    }
                    return null;
                })
                .filter(filter => filter !== null);

            filters.push(...summarizeByLeaves);

            if (summarizeByLeaves.length > 0) {
                filters.push({
                    id: summarizeByBranchId,
                    subjectEntity: summarizeByEntity,
                    type: "branch",
                    operator: summarizeByOperator,
                    children: summarizeByLeaves.map(leaf => leaf.id),
                });
            }
        }
    }

    return filters;
}

function parseFilterExpression(expression, subjectEntity) {
    let match = expression.match(/\((.*?)\)/);
    if (match) {
        const operator = expression.includes(" or ") ? "or" : "and";
        const children = match[1].split(operator === "or" ? " or " : " and ")
            .map(condition => parseFilterExpression(condition.trim(), subjectEntity))
            .filter(filter => filter !== null);

        if (children.length > 0) {
            return {
                id: generateId("br"),
                subjectEntity,
                type: "branch",
                operator,
                children: children.map(child => child.id)
            };
        }
    } else {
        const leaf = parseCondition(expression, subjectEntity);
        if (leaf) {
            return leaf;
        }
    }
    return null;
}

function oqlToQuery(oql) {
    oql = oql.replace(/^get works\s*/, '').trim();

    if (oql === '') {
        return {};
    }
    let summarizeBy = "works";

    const query = {};

    if (oql.includes("summarize by")) {
        const summarizeByMatch = oql.match(/summarize by (.*?)(?:where|;|$)/);
        if (summarizeByMatch) {
            query.summarize_by = summarizeByMatch[1].trim();
            summarizeBy = query.summarize_by;
        }
    }

    if (oql.includes("return")) {
        const returnMatch = oql.match(/return (.+?)(;|$)/);
        if (returnMatch) {
            let returnColumns = returnMatch[1].split(',').map(item => item.trim());
            query.return_columns = returnColumns.map(column => getColumnId(column, summarizeBy));
        }
    }

    if (oql.includes("sort by")) {
        const sortByMatch = oql.match(/sort by ([\w().]+) (asc|desc)/);
        if (sortByMatch) {
            const columnId = getColumnId(sortByMatch[1], summarizeBy);
            query.sort_by = {
                column_id: columnId,
                direction: sortByMatch[2]
            };
        }
    }

    if (oql.includes("where")) {
        query.filters = parseFilters(oql);
    }

    return query;
}

function queryToOQL(query) {
  if (!query.filters || query.filters.length === 0) {
    return "get works";
  }

  const rootFilter = findRootFilter(query.filters);
  let oql = `get ${rootFilter.subjectEntity} where `;
  oql += generateFilters(query.filters);

  if (query.summarize_by) {
    oql += `; summarize by ${query.summarize_by}`;

    const summaryFilters = query.filters.filter(filter => filter.subjectEntity === query.summarize_by);
    if (summaryFilters.length > 0) {
      oql += ` where ${generateFilters(summaryFilters)}`;
    }
  }

  if (query.sort_by) {
    oql += `; sort by ${query.sort_by.column_id} ${query.sort_by.direction}`;
  }

  if (query.return_columns && query.return_columns.length > 0) {
    oql += `; return ${query.return_columns.join(', ')}`;
  }

  return oql;
}

function findRootFilter(filters) {
  const childIds = new Set(filters.flatMap(filter => filter.children || []));
  return filters.find(filter => !childIds.has(filter.id));
}

function generateFilters(filters) {
  const rootFilter = findRootFilter(filters);
  return generateFilterString(rootFilter, filters);
}

function generateFilterString(filter, allFilters) {
  if (filter.type === 'leaf') {
    return `${filter.column_id} ${filter.operator || 'is'} ${filter.value}`;
  } else if (filter.type === 'branch') {
    const childFilters = filter.children.map(childId => {
      const childFilter = allFilters.find(f => f.id === childId);
      return generateFilterString(childFilter, allFilters);
    });

    const needsParentheses = filter.children.length > 1 &&
                             allFilters.some(f => f.type === 'branch' && f.id !== filter.id && f.subjectEntity === filter.subjectEntity);

    const joinedFilters = childFilters.join(` ${filter.operator} `);
    return needsParentheses ? `(${joinedFilters})` : joinedFilters;
  }
}

function formatValue(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return value;
}

export {
    oqlToQuery,
    queryToOQL
};