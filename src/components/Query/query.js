import shortUUID from 'short-uuid';
const makeFilterLeaf = function(subjectEntity){
    return {
        id: "leaf_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        operator: null,

        // leafy properties
        column_id: null,
        value: null,
    }
}
const makeFilterBranch = function(subjectEntity){
    return {
        id: "br_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        operator: "and",  // can be either "and" or "or"

        // branchy properties
        children: [],
    }
}


export {makeFilterLeaf, makeFilterBranch}