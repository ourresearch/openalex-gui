const defaultViews = {
    works: [
        "type",
        "type",
    ]
}


const clear = function () {

}
const setDefault = function (type) {
    console.log("pinboard.setDefault", type)
    const key = "pinboard." + type
    localStorage.setItem(key, JSON.stringify(defaultViews))
}


const getViews = function(type){
    const key = "pinboard." + type
    const resp = localStorage.getItem(key)
    return JSON.parse(resp)
}

const addView = function (type, viewKey) {
    const myViews = getViews(type)
    myViews.push(viewKey)
    const storageKey = "pinboard." + type
    localStorage.setItem(storageKey, JSON.stringify(myViews))
}
const removeView = function () {

}

const pinboard = {
    clear,
    setDefault,
    getViews,
    addView,
    removeView,
}

export {pinboard}