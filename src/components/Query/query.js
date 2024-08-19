import shortUUID from 'short-uuid';
const makeFilterLeaf = function(subjectEntity){
    return {
        id: "leaf_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        type: "leaf",
        operator: null,

        // leafy properties
        column_id: null,
        value: null,
    }
}
const makeFilterBranch = function(subjectEntity, isRoot=false){
    return {
        id: "br_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        type: "branch",
        operator: "and",  // can be either "and" or "or"

        // branchy properties
        children: [],
        isRoot
    }
}


export {makeFilterLeaf, makeFilterBranch}