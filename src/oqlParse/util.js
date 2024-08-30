import CryptoJS from "crypto-js";

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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

function hexToBigInt(hex) {
    return BigInt('0x' + hex);
}

function bigIntToBase58(num) {
    let base58 = '';
    const base = BigInt(58);
    while (num > 0) {
        const remainder = num % base;
        base58 = BASE58_ALPHABET[remainder] + base58;
        num = num / base;
    }
    return base58;
}

function objectMD5ShortUUID(obj) {
    const md5Hash = objectMD5(obj);
    const bigIntValue = hexToBigInt(md5Hash);
    const base58Str = bigIntToBase58(bigIntValue);
    return base58Str.slice(0, 5);
}



export {
    invertMap,
    objectMD5ShortUUID,
};