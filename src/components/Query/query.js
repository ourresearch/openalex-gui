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

const makeFilterButton = function () {
    // this is a button that will be used to add a new filter.
    // we're making a "filter" from it so that it can be added to the tree
    // but it's not really a filter.
    return {
        id: "button_" + shortUUID.generate().slice(0, 6),
        type: "button",
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
    }]));

    const root = [];

    flatTreeCopy.forEach(item => {
        if (item?.children?.length > 0) {
            item.children.forEach(childId => {
                const childNode = treeMap.get(childId);
                const parentNode = treeMap.get(item.id);
                childNode.parentId = parentNode.id;
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
            const newFilter = makeFilterButton()
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


const prettifyFilters = function (filters) {
    // const filtersCopy = _.cloneDeep(filters)

    return filters
        // remove branches that have no children
        .filter((f) => {
            return f.type === "leaf" || f.children?.length > 0
        })

}


export {
    makeFilterLeaf,
    makeFilterBranch,
    makeFilterButton,

    addFilterButtons,

    baseQuery,
    convertFlatToRecursive,
    deleteNode,
}