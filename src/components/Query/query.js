
const makeFilterLeaf = function(id, parent){
    return {
        id,
        type: "leaf",
        column_id: null,
        operator: null,
        value: [],
        parent,
    }
}
const makeFilterBranch = function(id, parent){
    return {
        id,
        type: "branch",
        operator: "and",
        children: [],
        parent,
    }
}


export {makeFilterLeaf, makeFilterBranch}