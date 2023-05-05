import axios from 'axios'
import _ from 'lodash'

const cache = {}
const getFromCache = function (url) {
    if (!cache[url]) return
    return _.cloneDeep(cache[url])
}
const clearCache = function () {
    Object.keys(cache).forEach(k => {
        cache[k] = null
    })
}

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
const makeUrl = function (pathName, searchParams, includeEmail = true) {
    const params = new URLSearchParams(searchParams);
    (includeEmail) && params.set("mailto", "team@ourresearch.org");
    params.set("per-page", 10)

    if (pathName.indexOf("/") !== 0) {
        pathName = "/" + pathName
    }
    const baseAndPath = urlBase.api + pathName;
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


const api = (function () {

    const getUrl = async function (url) {
        const cachedResponse = getFromCache(url)
        if (cachedResponse) {
            return cachedResponse
        }

        let res
        try {
            res = await axios.get(url)
            // console.log(`api GET ${url} success:`, res.data)
        } catch (e) {
            // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
            console.log("api GET failure:", e.response)
            throw e
        }
        cache[url] = res.data

        return res.data
    }

    return {
        createUrl: function (pathName, searchParams, includeEmail) {
            return makeUrl(pathName, searchParams, false)
        },
        async getEntityDisplayNames(openAlexIds) {
            const ret = {}
            await Promise.all(openAlexIds.map(async (id) => {
                const url = "https://api.openalex.org/" + id
                const resp = await axios.get(url)
                ret[id] = resp.data.display_name
            }))
            console.log("getEntityDisplayNames", ret)
            return ret
        },


        getUrl,
        get: async function (pathName, searchParams) {
            const url = makeUrl(pathName, searchParams)
            const resp = await getUrl(url)
            return resp
        }

    }
})()


export {
    api,
}