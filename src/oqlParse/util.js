import CryptoJS from "crypto-js";

function invertMap(map) {
    const invertedMap = {};
    for (const key in map) {
        if (map.hasOwnProperty(key)) {
            invertedMap[map[key]] = key;
        }
    }
    return invertedMap;
}

function objectMD5(obj) {
    const jsonString = JSON.stringify(obj);
    return CryptoJS.MD5(jsonString).toString();
}

export {
    invertMap,
    objectMD5,
};