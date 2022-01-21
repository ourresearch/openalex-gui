let urlBase = {
    api: "https://api.openalex.org",
    web: "https://explore.openalex.org",
    relative: "",
}


// this lets you develop against a local API endpoint
// to set the port, when you start your dev server, use: npm run serve -- --port <my port num>
// example:
// npm run serve -- --port 8081
if (window.location.port && parseInt(window.location.port) === 8081) {
    urlBase.api = "http://localhost:5004/"  // your locally-hosted API
    console.log("Setting API base URL to local machine (dev use only): " + urlBase.api)
} else if (window.location.port && parseInt(window.location.port) === 8082) {
    urlBase.api = "https://staging-jump-api.herokuapp.com/"  // staging heroku url
    console.log("Setting API base URL to staging heroku (dev use only): " + urlBase.api)
}


// @pathName is the path, like /works
// @searchParams can be in these formats:
//      {foo: 42, bar: 43}
//      [["foo", 42], ["bar", 43]]
//      ?foo=42&bar=43
// @base is "web" or "api"
const makeUrl = function (pathName, searchParams, base = "relative") {
    const params = new URLSearchParams(searchParams);
    (base === "api") && params.set("mailto", "team@ourresearch.org");

    const baseAndPath = urlBase[base] + pathName;


    const paramsStr = [...params.entries()]
        .filter(p => {
            return p[1]
        })
        .map(p => {
            return p[0] + "=" + p[1]
        })
        .join("&")


    return [baseAndPath, paramsStr].join("?")
}

const addFilter = function (k, v, oldFilters) {
    v = v.replace(":", " ").replace(",", " ")
    oldFilters = oldFilters ?? ""

    const updated = oldFilters
        .split(",")
        .filter(f => {
            return f && f.split(":")[0] !== k
        })

    updated.push(k + ":" + v)
    return updated
        .sort()
        .join(",")
}
const readFilter = function(k, filters){
    if (filters.indexOf(":") === -1) return
    const matchingFilter = filters.split(",").find(f => {
        return f && f.split(":")[0] === k
    })
    return matchingFilter && matchingFilter.split(":")[1]
}


export {
    makeUrl,
    addFilter,
    readFilter,
}