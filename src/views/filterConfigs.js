

const createFilter = function ({key, value, count, isApplied}) {
    if (typeof value === "string") {
        value = value.replace("https://openalex.org/", "")
    }

    return {
        id: key + ":" + value,
        key,
        value,
        count,
        isApplied,
        displayName: value,
    }
}

export {
    createFilter,
}