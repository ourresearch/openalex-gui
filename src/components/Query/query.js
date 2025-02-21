import shortUUID from 'short-uuid';
import {getConfigs} from "@/oaxConfigs";
import {queryToOQL} from "@/oqlParse/oqlParse";


const getDefaultFilterOperator = function (subjectEntity, column_id) {
    const configs = getConfigs()
    const entity = configs.entities.find(e => e.name === subjectEntity)
    const column = entity.columns.find(c => c.id === column_id)
    return column.defaultFilterOperator

}

const makeFilterLeaf = function (subjectEntity) {
    return {
        id: "leaf_" + shortUUID.generate().slice(0, 6),
        subjectEntity,
        type: "leaf",

        column_id: null,
        operator: null,
        value: null,
    }
}
const makeFilterBranch = function (subjectEntity) {
    return {
        id: "br_" + shortUUID.generate().slice(0, 6),
        subjectEntity,
        type: "branch",
        operator: "and",  // can be either "and" or "or"
        children: [],
    }
}

const makeFilterButton = function (subjectEntity) {
    // this is a button that will be used to add a new filter.
    // we're making a "filter" from it so that it can be added to the tree
    // but it's not really a filter.
    return {
        id: "button_" + shortUUID.generate().slice(0, 6),
        type: "button",
        subjectEntity,
    }
}


const baseQuery = (entity = 'works') => {
    let query;
    if (entity == "summary") {
        query = {
            get_rows: "summary",
        }; 
        return query;
    } 
    const config = getConfigs()[entity];    
    query = {
        get_rows: entity,
        filter_works: [],
        filter_aggs: [],
        show_columns: config.showOnTablePage,
        sort_by_column: config.sortByDefault,
        sort_by_order: config.sortDirDefault,
    };
    console.log("baseQuery", query);
    return query;
}


const queryFactory = function (summarize_by, sort_by, show_columns, filters) {
    if (!summarize_by) throw new Error("queryFactory: summarize_by is required")
    const baseQuery = baseQuery()
    baseQuery.summarize_by = summarize_by


}


// FILTER STUFF


function convertFlatToRecursive(flatTree) {
    const flatTreeCopy = _.cloneDeep(flatTree);

    const treeMap = new Map(flatTreeCopy.map(item => [item.id, {
        ...item,
        children: [],
        isRoot: false,
        siblingIndex: null,
        parentId: null,
        siblingsCount: 0,  // Initialize siblingsCount
        parentOperator: "and",  // Initialize parentOperator
    }]));

    const root = [];

    flatTreeCopy.forEach(item => {
        if (item?.children?.length > 0) {
            item.children.forEach(childId => {
                const childNode = treeMap.get(childId);
                const parentNode = treeMap.get(item.id);
                childNode.parentId = parentNode.id;
                childNode.parentOperator = parentNode.operator || "and";  // Set parentOperator
                treeMap.get(item.id).children.push(childNode);
            });
        }
    });

    flatTreeCopy.forEach(item => {
        if (!flatTreeCopy.some(node => node?.children?.includes(item.id))) {
            const rootNode = treeMap.get(item.id);
            rootNode.isRoot = true;
            root.push(rootNode);
        }
    });

    root.forEach((node, index) => {
        node.siblingIndex = index;
    });

    treeMap.forEach(node => {
        if (node.children.length > 0) {
            node.children.forEach((child, index) => {
                if (child) {
                    child.siblingIndex = index;
                    child.siblingsCount = node.children.length - 1;  // Set siblingsCount
                }
            });
        }
    });

    return root;
}

function deleteNode(tree, idToDelete) {
    const idsToDelete = new Set();

    function findNodesToDelete(nodeId) {
        idsToDelete.add(nodeId);
        const node = tree.find(n => n.id === nodeId);
        if (node && Array.isArray(node.children)) {
            node.children.forEach(childId => findNodesToDelete(childId));
        }
    }

    findNodesToDelete(idToDelete);

    return tree
        .filter(node => !idsToDelete.has(node.id))
        .map(node => ({
            ...node,
            children: Array.isArray(node.children) ? node.children.filter(childId => !idsToDelete.has(childId)) : []
        }));
}

/**
 * Gets a list of IDs of filters that are type "branch" and at the root.
 * Note: this doesn't return root nodes that are of type "leaf".
 * @param {array} filters - A flat list of filter objects, some of whom have children.
 * @returns {array} A list of IDs of the root nodes that are of type "branch".
 */
const getRootNodeBranchIds = function (filters) {
    const filtersCopy = _.cloneDeep(filters);
    const ids = filtersCopy.map(f => f.id);
    const children = filtersCopy.map(f => f.children).flat();
    return ids.filter(id => {
        const filter = filtersCopy.find(f => f.id === id);
        return !children.includes(id) && filter.type === "branch";
    });
}

/**
 * Gets a copy of the filters list, with the root nodes of type "branch" deleted.
 * This is a hack until the server gives it to us in this format.
 * @param {array} filters - A flat list of filter objects, some of whom have children.
 * @returns {array} A new list of filter objects with the root nodes deleted.
 */
const deleteRootNodes = function (filters) {
    const filtersCopy = _.cloneDeep(filters)
    const rootIds = getRootNodeBranchIds(filtersCopy)
    return filtersCopy.filter(f => !rootIds.includes(f.id))
}


/**
 * Adds a new "filter" button to the end of every filter branch's children.
 * This is used by the UI to add a new filter to the tree.
 * @param {array} filters - A list of filter objects.
 * @returns {array} A new list of filter objects with a new filter button added.
 */
function addFilterButtons(filters) {
    const newFilters = [];
    const filtersCopy = _.cloneDeep(filters)
    const ret = filtersCopy.map(f => {
        if (f.type === "branch") {
            const newFilter = makeFilterButton(f.subjectEntity)
            newFilters.push(newFilter)
            return {
                ...f,
                children: [...f.children, newFilter.id]
            }
        } else {
            return f
        }
    })
    return [...ret, ...newFilters]
}

const queryToOqlWrapper = function (query) {
    return queryCopy

    // Add a root-level wrapper branch filter to the works filters
    const worksFilters = queryCopy.filters.filter(f => f.subjectEntity === "works");
    if (worksFilters.length > 0) {
        const worksBranch = makeFilterBranch("works");
        worksBranch.children = worksFilters.map(f => f.id);
        queryCopy.filters = [...queryCopy.filters, worksBranch];
    }

    console.log("queryCopy.filters", queryCopy.filters)

    // Add a root-level wrapper branch filter to the entity filters if there are any
    // const entityFilters = queryCopy.filters.filter(f => f.subjectEntity !== "works");
    // if (entityFilters.length > 0) {
    //     const entityBranch = makeFilterBranch("entity");
    //     entityBranch.children = entityFilters.map(f => f.id);
    //     queryCopy.filters = [...queryCopy.filters, entityBranch];
    // }

    return queryToOQL(queryCopy);
}

const cleanFilters = function (filters) {

    const filterBranchKeys = Object.keys(makeFilterBranch('works'))
    const filterLeafKeys = Object.keys(makeFilterLeaf('works'))

    let filtersCopy = _.cloneDeep(filters)

    // remove empty branches
    filtersCopy = filtersCopy.filter(f => f.type !== "branch" || f.children.length > 0)

    // remove a root works branch if it has no siblings.
    // this is a hack until the server can give us the filters in the correct format.
    const rootBranchWorkFilterIds = getRootNodeBranchIds(filtersCopy.filter(f => f.subjectEntity === "works"))
    if (rootBranchWorkFilterIds.length === 1 && filtersCopy.filter(f => f.subjectEntity === "works").length === 1) {
        filtersCopy = filtersCopy.filter(f => f.id !== rootBranchWorkFilterIds[0])
    }


    // remove attributes that are only used by the UI, using the filterBranchKeys and filterLeafKeys
    const ret = filtersCopy.map(f => {
        if (f.type === "branch") {
            return filterBranchKeys.reduce((acc, key) => {
                if (f.hasOwnProperty(key)) {
                    acc[key] = f[key];
                }
                return acc;
            }, {});
        } else if (f.type === "leaf") {
            return filterLeafKeys.reduce((acc, key) => {
                if (f.hasOwnProperty(key)) {
                    acc[key] = f[key];
                }
                return acc;
            }, {});
        }
        return f;
    });
    return ret
}


export {
    makeFilterLeaf,

    makeFilterBranch,
    makeFilterButton,

    cleanFilters,
    deleteRootNodes,

    baseQuery,
    convertFlatToRecursive,
    deleteNode,

    queryToOqlWrapper,
}