import shortUUID from 'short-uuid';
const makeFilterLeaf = function(subjectEntity){
    return {
        id: "leaf_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        type: "leaf",

        column_id: null,
        operator: null,
        value: null,
    }
}
const makeFilterBranch = function(subjectEntity){
    return {
        id: "br_" + shortUUID.generate().slice(0,6),
        subjectEntity,
        type: "branch",

        operator: "and",  // can be either "and" or "or"
        children: [],
    }
}


export {makeFilterLeaf, makeFilterBranch}