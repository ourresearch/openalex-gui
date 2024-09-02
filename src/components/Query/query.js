import shortUUID from 'short-uuid';
import {getConfigs} from "@/oaxConfigs";

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


const baseQuery = () => ({
    filters: [
        makeFilterBranch("works")
    ],
    summarize_by: null,
    sort_by: {
        column_id: "display_name",
        direction: "asc",
    },
    return_columns: getConfigs().works.showOnTablePage,
})


const queryFactory = function (summarize_by, sort_by, return_columns, filters) {
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


const cleanFiltersForServer = function (filters) {
    const filtersCopy = _.cloneDeep(filters)

    // remove button filters
    const buttonFilters = filtersCopy.filter(f => f.type === "button")
    let noButtonFilters = filtersCopy
    buttonFilters.forEach(buttonFilter => {
        noButtonFilters = deleteNode(noButtonFilters, buttonFilter.id)
    })

    // remove useless "children" attribute from leaf nodes
    const noChildrenOnLeafNodes = noButtonFilters.map(f => {
        if (f.type === "leaf") {
            delete f.children
        }
        return f
    })

    // remove empty branches
    const noEmptyBranches = noChildrenOnLeafNodes.filter(f => f.type !== "branch" || f.children.length > 0)

    // remove UI-only attributes
    const noUiAttributes = noEmptyBranches.map(f => {
        delete f.siblingIndex
        delete f.isRoot
        return f
    })

    // done
    return noUiAttributes
}


export {
    makeFilterLeaf,
    makeFilterBranch,
    makeFilterButton,

    addFilterButtons,
    cleanFiltersForServer,
    deleteRootNodes,

    baseQuery,
    convertFlatToRecursive,
    deleteNode,
}