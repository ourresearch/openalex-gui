async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function hashCode(str) {
    return Math.abs(str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0));
}

const toHexHash = function (str) {
    return "0x" + hashCode(str).toString(16)
}


const entityTypesDict = {
    "w": "works",
    "i": "institutions",
    "v": "venues",
    "a": "authors",
    "c": "concepts",
};

const shortenOpenAlexId = function (longId) {
    return longId.replace("https://openalex.org/", "").toLowerCase()
}

const entityTypeFromId = function (id) {
    const firstLetter = shortenOpenAlexId(id).substr(0, 1)
    return entityTypesDict[firstLetter]
}

const idsAreEqual = function(id1, id2){
    if (!id1 || !id2) return
    return shortenOpenAlexId(id1) === shortenOpenAlexId(id2)
}




const unravel = function(invertedIndex){
    if (!invertedIndex) return
    const unraveled = {}
    Object.entries(invertedIndex).forEach(([k, v]) => {
        v.forEach(myValue => {
            unraveled[myValue] = k
        })
    })
    const ret = Object.values(unraveled)
        .join(" ")
        .replace("\n", "")
        .replace(/^[Aa]bstract/, "")
    return ret
}

const entityTypes = {
    all() {
        return Object.values(entityTypesDict)
    },
    allExcept(removeThisOne) {
        return Object.values(entityTypesDict).filter(e => e !== removeThisOne)
    },
    fromId(id) {
        const firstLetter = shortenOpenAlexId(id).substr(0, 1)
        return entityTypesDict[firstLetter]
    }
}


export {
    sleep,
    toHexHash,
    shortenOpenAlexId,
    entityTypeFromId,
    entityTypes,
    unravel,
    idsAreEqual,
}