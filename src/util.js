import * as openalexId from "@/openalexId";

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
    "g": "awards",
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


/**
 * @deprecated Use openalexId.getShortId() or openalexId.normalizeId() instead
 */
const shortenOpenAlexId = function (longId) {
    if (typeof longId !== "string") return longId
    // Delegate to new module - returns the short part of a normalized ID
    const shortId = openalexId.getShortId(longId)
    if (shortId) return shortId
    // Fallback for non-OpenAlex IDs - just do basic cleanup
    let ret = longId.replace("https://openalex.org/", "").toLowerCase()
    ret = ret.replace("openalex:", "").toLowerCase()
    return ret.toLowerCase()
}

/**
 * @deprecated Use openalexId.getEntityType() instead
 */
const entityTypeFromId = function (id) {
    return openalexId.getEntityType(id)
}
/**
 * @deprecated Use openalexId.isValidId() instead
 */
const isOpenAlexId = function (str) {
    return openalexId.isValidId(str)
}


/**
 * @deprecated Use openalexId.idsAreEqual() instead
 */
const idsAreEqual = function (id1, id2) {
    if (!id1 || !id2) return false
    return openalexId.idsAreEqual(id1, id2)
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

/**
 * @deprecated Use openalexId module instead
 */
const entityTypes = {
    all() {
        return Object.values(entityTypesDict)
    },
    allExcept(removeThisOne) {
        return Object.values(entityTypesDict).filter(e => e !== removeThisOne)
    },
    fromId(id) {
        return openalexId.getEntityType(id)
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


// Strip any characters that can't appear in an email-link login token.
// Magic-login / verify-email tokens are base64url (secrets.token_urlsafe →
// [A-Za-z0-9_-]). Some recipient mail gateways append a stray character — a
// trailing quote — to the button's URL, so the clicked link is
// .../magic-token/<token>' and the lookup misses (Zendesk #8891). A real
// token never contains anything outside the alphabet, so dropping those
// chars safely recovers it. Returns "" for null/undefined.
const sanitizeLoginToken = (raw) => (raw || "").replace(/[^A-Za-z0-9_-]/g, "");


// Max length of an accepted redirect path. A SERP fullPath with a big filter
// string is legitimately long, so this is generous; it exists only to stop
// someone stuffing kilobytes into an email we send.
const REDIRECT_PATH_MAX_LENGTH = 2048;

// Reduce a post-auth destination to a safe same-origin path, or hand back the
// fallback. `redirect` starts life in an attacker-suppliable URL
// (openalex.org/signup?redirect=…) and — since oxjob #855 — rides through an
// email we send, so it must be validated at every hop: produced (Signup/Login
// before the POST), embedded (users-api before the template renders), and
// consumed (UserMagicToken before router.push). This is the JS half; the twin
// is `sanitize_redirect_path` in openalex-users-api/redirect_path.py. Keep the
// two in sync — their test suites mirror each other.
//
// Accepts only a path on our own origin: exactly one leading "/", no
// protocol-relative "//evil.com" or "/\evil.com", no backslashes, no control
// characters. The control-char rule is load-bearing rather than cosmetic —
// browsers strip tabs/newlines out of URLs, so "/\t/evil.com" would otherwise
// re-form as protocol-relative "//evil.com" after we let it through.
//
// Never throws: a throw from inside a render path unmounts the Vue subtree
// silently (see the CLAUDE.md note), and a bad redirect must degrade to the
// fallback, never break login.
const sanitizeRedirectPath = (raw, fallback = "/") => {
    if (typeof raw !== "string") return fallback;
    if (!raw.length || raw.length > REDIRECT_PATH_MAX_LENGTH) return fallback;
    if (raw[0] !== "/") return fallback;          // relative, absolute URL, or "javascript:"
    if (raw[1] === "/" || raw[1] === "\\") return fallback;  // protocol-relative
    if (raw.includes("\\")) return fallback;
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001F\u007F]/.test(raw)) return fallback;
    return raw;
};


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
    sanitizeLoginToken,
    sanitizeRedirectPath,
}