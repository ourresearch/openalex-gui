import shortUUID from 'short-uuid';
const makeFilterLeaf = function(subjectEntity){
    return {
        id: "leaf_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        operator: null,
        type: "leaf",

        // leafy properties
        column_id: null,
        value: null,
        // children: [],
    }
}
const makeFilterBranch = function(subjectEntity){
    return {
        id: "br_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        operator: "and",  // can be either "and" or "or"
        type: "branch",

        // branchy properties
        children: [],
    }
}


export {makeFilterLeaf, makeFilterBranch}