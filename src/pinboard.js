const defaultViews = {
    works: [
        "type",
    ]
}

const init = function(type){
    return (getViews(type).length) ?
        getViews(type) :
        setDefault(type)
}

const clear = function () {

}
const setDefault = function (type) {
    console.log("pinboard.setDefault", type)
    const key = "pinboard." + type
    localStorage.setItem(key, JSON.stringify(defaultViews[type]))
    return defaultViews
}


const getViews = function(type){
    const key = "pinboard." + type
    const resp = localStorage.getItem(key)
    return (resp && JSON.parse(resp)) ?
        JSON.parse(resp) :
        []
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
    init,
    clear,
    setDefault,
    getViews,
    addView,
    removeView,
}

export {pinboard}