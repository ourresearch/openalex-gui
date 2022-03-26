async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function hashCode(str) {
    return Math.abs(str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0));
}
const toHexHash = function(str){
    return "0x" + hashCode(str).toString(16)
}



const entityTypes = {
    "w": "works",
    "i": "institutions",
    "v": "venues",
    "a": "authors",
    "c": "concepts",
};

const shortenOpenAlexId = function(longId){
    return longId.replace("https://openalex.org/", "").toLowerCase()
}

const entityTypeFromId = function(id){
    const firstLetter = shortenOpenAlexId(id).substr(0, 1)
    return entityTypes[firstLetter]
}



export {
    sleep,
    toHexHash,
    shortenOpenAlexId,
    entityTypeFromId,
}