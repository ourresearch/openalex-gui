import {externalEntityTypeFromId, nativeEntityTypeFromId} from "@/entityConfigs";

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

const setOrDelete = function (obj, k, v) {
    if (v) {
        obj[k] = v
    } else {
        delete obj[k]
    }
    return obj
}

function hashCode(str) {
    return Math.abs(str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0));
}

const toHexHash = function (str) {
    return "0x" + hashCode(str).toString(16)
}

function sortByKey(array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

const entityTypesDict = {
    "w": "works",
    "i": "institutions",
    "v": "venues",
    "s": "sources",
    "p": "publishers",
    "f": "funders",
    "a": "authors",
    "c": "concepts",
};

/**
 * Format number to significant digits.
 * https://stackoverflow.com/a/58494899
 *
 * @param {Number} number
 * @param {Number} precision
 *
 * @return {String} formattedValue
 */
const toPrecision = function (number, precision) {
    function round(precision, number) {
        return parseFloat(number.toPrecision(precision))
    }

    if (typeof number === 'undefined' || number === null) return ''

    if (number === 0) return '0'
    if (typeof number === 'string') number = parseFloat(number);

    const roundedValue = round(precision, number)
    const floorValue = Math.floor(roundedValue)

    const isInteger = Math.abs(floorValue - roundedValue) < Number.EPSILON

    const numberOfFloorDigits = String(floorValue).length
    const numberOfDigits = String(roundedValue).length

    if (numberOfFloorDigits > precision) {
        return floorValue.toLocaleString()
    } else {
        const padding = isInteger ? precision - numberOfFloorDigits : precision - numberOfDigits + 1

        if (padding > 0) {
            let ret
            if (isInteger) {
                ret = `${String(floorValue)}.${'0'.repeat(padding)}`
            } else {
                ret = `${String(roundedValue)}${'0'.repeat(padding)}`
            }
            return parseFloat(ret).toLocaleString()
        } else {
            return roundedValue.toLocaleString()
        }
    }
}


const shortenOpenAlexId = function (longId) {
    if (typeof longId !== "string") return longId
    let ret = longId.replace("https://openalex.org/", "").toLowerCase()
    ret = ret.replace("openalex:", "").toLowerCase()
    return ret.toLowerCase()
}

const entityTypeFromId = function (id) {
    return nativeEntityTypeFromId(id) ?? externalEntityTypeFromId(id)
}
const isOpenAlexId = function (str) {
    const regex = /^(?:https:\/\/openalex\.org\/)?(?:openalex:)?([WwAaSsPpFfIiCc]\d+)$/
    return regex.test(str)
}


const idsAreEqual = function (id1, id2) {
    if (!id1 || !id2) return
    return shortenOpenAlexId(id1) === shortenOpenAlexId(id2)
}


const compareByCount = function (a, b) {
    if (a.count > b.count) {
        return -1;
    }
    if (a.count < b.count) {
        return 1;
    }
    return 0;
}


const unravel = function (invertedIndex) {
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

/**
 * Determine whether the given `date` is today.
 *
 * @param {Date} date
 *
 * @returns {Boolean}
 */
function isToday(date) {
    if (!(date instanceof Date)) {
        throw new Error('Invalid argument: you must provide a "date" instance')
    }
    const today = new Date()
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
}

const uniqueObjects = function (arrayOfObjects) {
    return [...new Set(arrayOfObjects.map(o => JSON.stringify(o)))].map(str => {
        return JSON.parse(str)
    })
}

// return false for falsey values as well as empty strings, empty arrays, and empty objects
const isDisplayable = function (value) {
    if (!value) return false
    if (Array.isArray(value) && value.length === 0) return false
    if (typeof value === "object") {
        const keys = Object.keys(value)
        if (keys.length === 0) return false
        if (keys.includes("display_name") && !value.display_name) return false
        if (keys.includes("id") && !value.id) return false
    }
    return true

}

function ordinalize(i) {
    let j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
        return i + "st";
    }
    if (j === 2 && k !== 12) {
        return i + "nd";
    }
    if (j === 3 && k !== 13) {
        return i + "rd";
    }
    return i + "th";
}


export {
    sortByKey,
    sleep,
    toHexHash,
    shortenOpenAlexId,
    entityTypeFromId,
    isOpenAlexId,
    entityTypes,
    unravel,
    idsAreEqual,
    setOrDelete,
    compareByCount,
    toPrecision,
    isToday,
    uniqueObjects,
    isDisplayable,
    ordinalize,
}