function generateId(prefix = "leaf") {
    return `${prefix}_${Math.random().toString(36).substr(2, 8)}`;
}

function parseCondition(condition, subjectEntity) {
    let match = condition.match(/(\S+)\s+(is not|is)\s+(.+)/);
    if (match) {
        let column_id = match[1];
        let operator = match[2] === 'is' ? 'is' : 'is not';
        let value = match[3].replace(/;/g, '').trim();

        if (value.match(/^\d+$/)) {
            value = parseInt(value, 10);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }

        return {
            id: generateId(),
            subjectEntity,
            type: "leaf",
            operator,
            column_id,
            value: [value]
        };
    }
    return null;
}

function parseFilters(oql) {
    const filters = [];
    const worksConditions = [];
    let summarizeByCondition = null;
    let summarizeByEntity = null;

    const worksMatch = oql.match(/where (.+?)(;|$)/);
    if (worksMatch) {
        worksConditions.push(...worksMatch[1].split(" and "));
    }

    const summarizeByMatch = oql.match(/summarize by (\w) where (.+?)(;|$)/);
    if (summarizeByMatch) {
        summarizeByEntity = summarizeByMatch[1];
        summarizeByCondition = summarizeByMatch[2];
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
            operator: "and",
            children: worksBranchChildren,
            isRoot: true
        });
    }

    if (summarizeByMatch) {
        const summarizeByBranchId = generateId("br");
        const summarizeByLeaf = parseCondition(summarizeByCondition, summarizeByEntity);
        if (summarizeByLeaf) {
            filters.push(summarizeByLeaf);
            filters.push({
                id: summarizeByBranchId,
                subjectEntity: summarizeByEntity,
                type: "branch",
                operator: "and",
                children: [summarizeByLeaf.id],
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
            query.sort_by = {
                column_id: sortByMatch[1],
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
}