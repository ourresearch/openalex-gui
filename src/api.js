import axios from 'axios'
import _ from 'lodash'
import {url} from "@/url";
import {createDisplayFilter, createSimpleFilter} from "@/filterConfigs";
import {openAlexCountries} from "@/countries";
import countryCodeLookup from "country-code-lookup";
import {getFacetConfig} from "@/facetConfigs";

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

// hack to get around the lack of an autocomplete endpoint for countries
const autocompleteCountry = function (searchString) {
    return openAlexCountries
        .filter(c => {
            return c.display_name.toLowerCase().includes(searchString.toLowerCase())
        })
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
        getEntityDisplayName: async function (id) {
            const myUrl = makeUrl(id, {select: "display_name"})
            const resp = await getUrl(myUrl)
            return resp
        },
        getUrl,
        get: async function (pathName, searchParams) {
            const url = makeUrl(pathName, searchParams)
            const resp = await getUrl(url)
            return resp
        },
        getAutocompleteResponses: async function (entityType, filterKey, searchString) {
            const myConfig = getFacetConfig(entityType, filterKey)
            console.log("getAutocompleteResponses()", myConfig)

            if (myConfig.entityId) {
                if (!searchString) return []
                const myUrl = url.makeAutocompleteUrl(myConfig.entityId, filterKey, searchString)
                const resp = await getUrl(myUrl)
                return resp.results

            } else {
                const myUrl = url.makeGroupByUrl(entityType, filterKey, {
                    searchString
                })
                const resp = await getUrl(myUrl)
                return resp.group_by.map(group => {
                    return {
                        id: group.key,
                        display_name: group.key_display_name
                    }
                })
            }
        },

        getGroups: async function (entityType, filterKey, options) {
            const myUrl = url.makeGroupByUrl(
                entityType,
                filterKey,
                options,
            )
            const resp = await axios.get(myUrl)
            const filteredGroups = resp.data.group_by.filter(g => {
                const keyIsNullish = g.key === "unknown" || g.key === null
                return !(keyIsNullish && options.hideUnknown)
            })

            const maxGroups = (options.perPage) ? options.perPage - 1 : 300
            const truncatedGroups = filteredGroups.splice(0, maxGroups)

            const groupCounts = truncatedGroups.map(g => g.count)
            const maxCount = Math.max(...groupCounts)
            const countSum = groupCounts.reduce((a, b)=> a + b, 0)
            const groupDisplayFilters = truncatedGroups
                .map(group => {
                    return createDisplayFilter(
                        entityType,
                        filterKey,
                        group.key,
                        false,
                        group.key_display_name,
                        group.count,
                        group.count / countSum,
                    )
                })

            return groupDisplayFilters
        }

    }
})()


export {
    api,
}