import sanitizeHtml from "sanitize-html";
import _ from "lodash"

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
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
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
const toPrecision = function(number, precision) {
    function round(precision, number) {
        return parseFloat(number.toPrecision(precision))
    }

    if (typeof number === 'undefined' || number === null) return ''

    if (number === 0) return '0'

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
    return longId.replace("https://openalex.org/", "").toLowerCase()
}

const entityTypeFromId = function (id) {
    const firstLetter = shortenOpenAlexId(id).substr(0, 1)
    return entityTypesDict[firstLetter]
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

const prettyTitle = function (title, facetKey) {
    if (!title) return "No title"
    if (title && title.toUpperCase() === title) {
        title = _.startCase(title.toLowerCase());
    }
    if (facetKey && facetKey === "type") {
        title = title.replace("-", " ")
        title = _.capitalize(title)
    }
    if (facetKey === "authorships.institutions.country_code") {
        title = title
          .replace("ieee", "IEEE")
          .replace("United States of America", "United States")
          .replace("United Kingdom of Great Britain and Northern Ireland", "United Kingdom")
    }



    const safeTitle = sanitizeHtml(title, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    })
    return safeTitle
}


export {
    sortByKey,
    sleep,
    toHexHash,
    shortenOpenAlexId,
    entityTypeFromId,
    entityTypes,
    unravel,
    idsAreEqual,
    setOrDelete,
    prettyTitle,
    compareByCount,
    toPrecision,
}