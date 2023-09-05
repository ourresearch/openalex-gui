const defaultWidgets = {
    works: [
        "type",
        "open_access.is_oa",
        "authorships.institutions.id",
        "authorships.institutions.country_code",
        "primary_location.source.id",
    ],
    authors:[
        "last_known_institution.id",
        "last_known_institution.country_code",
        "has_orcid",
    ],
    sources:[
        "type",
        "publisher",
        "is_oa",
    ],
    publishers:[
    ],
    funders:[
    ],
    institutions:[
        "type",
        "country_code",
    ],
    concepts:[
        "level",
    ],
}

const init = function(entityType){
    return (getWidgets(entityType).length) ?
        getWidgets(entityType) :
        setDefault(entityType)
}

const clear = function () {

}
const setDefault = function (entityType) {
    const key = "pinboard." + entityType
    localStorage.setItem(key, JSON.stringify(defaultWidgets[entityType]))
    return defaultWidgets
}


const getWidgets = function(entityType){
    const key = "pinboard." + entityType
    const resp = localStorage.getItem(key)
    console.log("getWidgets", resp)
    return (resp && JSON.parse(resp)) ?
        JSON.parse(resp) :
        []
}

const addWidget = function (entityType, widgetKey) {
    const myWidgets = getWidgets(entityType)
    myWidgets.push(widgetKey)
    const storageKey = "pinboard." + entityType
    localStorage.setItem(storageKey, JSON.stringify(myWidgets))
}
const deleteWidget = function (entityType, widgetKey) {
    const myWidgets = getWidgets(entityType)
    const newWidgets = myWidgets.filter(v => v !== widgetKey)
    const storageKey = "pinboard." + entityType
    localStorage.setItem(storageKey, JSON.stringify(newWidgets))

}

const pinboard = {
    init,
    clear,
    setDefault,
    getWidgets,
    addWidget,
    deleteWidget,
}

export {pinboard}