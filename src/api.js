import axios from 'axios'
import _ from 'lodash'
import ISO6391 from 'iso-639-1'

import {url} from "@/url";
import {createDisplayFilter, createSimpleFilter, filtersAsUrlStr} from "@/filterConfigs";
import {openAlexCountries} from "@/countries";
import {getFacetConfig} from "@/facetConfigUtils";
import {collectionMatchType, filterCollectionsForField} from "@/collectionFilter";
import {openAlexSdgs} from "@/sdgs";
import {getEntityConfig} from "@/entityConfigs";
import {urlBase, axiosConfig, DISABLE_SERVER_CACHE} from "@/apiConfig";
import store from "@/store";

const cache = {};

const getFromCache = function (url) {
    if (!cache[url]) { return; }
    return _.cloneDeep(cache[url]);
}

const stockCache = function (url, ret) {
    cache[url] = _.cloneDeep(ret);
}

const api = (function () {

    const makeUrl = function (pathName, searchParams) {
    // @pathName is the path, like /works
    // @searchParams can be in these formats: {foo: 42, bar: 43}, [["foo", 42], ["bar", 43]], ?foo=42&bar=43

        const params = new URLSearchParams(searchParams);

        // TODO shouldn't be on all URLs
        if (!pathName.startsWith("/autocomplete/")) {
            !params.get("per-page") && params.set("per-page", 10);
        }

        params.set("mailto", "ui@openalex.org");

        if (pathName.indexOf("/") !== 0) {
            pathName = "/" + pathName;
        }
        const baseAndPath = urlBase.api + pathName;
        const paramsStr = [...params.entries()]
            .filter(p => {
                return p[1];
            })
            .map(p => {
                return p[0] + "=" + p[1];
            })
            .join("&");

        const url = paramsStr ? [baseAndPath, paramsStr].join("?") : baseAndPath;
        //console.log("makeUrl OUTPUT", url);
        return url;
    }

    const getUrl = async function (url, config) {
        config = config || axiosConfig();
        
        if (!url.startsWith("http")) { 
            url = urlBase.api + url;
        }

        if (url.includes("filter=")) { // sdgs hack
            url = url.replace("sdgs/", "");
        }

        if (store.state.useV2) {
            url += url.includes('?') ? '&data-version=2' : '?data-version=2';
        }

        const cachedResponse = getFromCache(url);
        if (cachedResponse) {
            //console.log("cache hit: " + url);
            return cachedResponse;
        }

        let res;
        try {
            //console.log(`GET ${url}`);
            res = await axios.get(url, config);
            // console.log(`api GET ${url} success:`, res.data)
        } catch (e) {
            // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
            console.log("api GET failure:", e.response);
            if (e.response?.status === 429 && !store.state.user.id) {
                store.commit('showCreditLimitDialog');
            }
            throw e
        }
        stockCache(url, res.data);
        return res.data;
    }

    const get =  async function (pathName, searchParams) {
        const url = makeUrl(pathName, searchParams);
        const resp = await getUrl(url);
        return resp;
    }

    const post = async function(url, data, config) {
        const resp = await axios.post(url, data, config);
        return resp;
    }

    const getResultsList = async function (url) {
        const ret = await getUrl(url);
        
        // TEMPORARY HACK: Awards use 'title' instead of 'display_name'
        // Copy title to display_name until API is updated
        if (ret.results && url.includes('/awards')) {
            ret.results = ret.results.map(award => ({
                ...award,
                display_name: award.title || award.display_name
            }));
        }
        
        return ret;
    };

    const getEntity = async function (id) {
        const myUrl = makeUrl(id);
        const resp = await getUrl(myUrl);
        
        // TEMPORARY HACK: Awards use 'title' instead of 'display_name'
        // Copy title to display_name until API is updated
        if (id && id.includes('/G') && resp.title && !resp.display_name) {
            resp.display_name = resp.title;
        }
        
        return resp;
    };

    const getEntityFromCache = function(id) {
        const myUrl = makeUrl(id);
        return _.cloneDeep(cache[myUrl]);
    };

    const getEntityDisplayName = async function (entityName, id) {
        const path = entityName + "/" + id;
        const myUrl = makeUrl(path, {select: "display_name"});
        const resp = await getUrl(myUrl);
        return resp.display_name;
    };

    const getFilterValueDisplayName = async function (filterKey, filterValue, entityType = "works") {
        const entityId = getFacetConfig(entityType, filterKey)?.entityToSelect;

        if (filterKey === "institutions.country_code" || filterKey === "country_code" || filterKey.endsWith(".country_code") || entityId === "countries") {
            return openAlexCountries.find(c => c.id.toLowerCase() === filterValue.toLowerCase())?.display_name;
        } else if (filterKey === "type") {
            // Work types: just capitalize and replace hyphens with spaces
            return filterValue.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else if (filterKey === "sustainable_development_goals.id") {
            // SDG IDs can be short (e.g., "3") or full URLs (e.g., "https://metadata.un.org/sdg/3")
            const shortId = filterValue.replace(/.*\//, '').toLowerCase();
            return openAlexSdgs.find(c => {
                const cShortId = c.id.replace(/.*\//, '').toLowerCase();
                return cShortId === shortId || c.id.toLowerCase() === filterValue.toLowerCase();
            })?.display_name;
        } else if (filterKey === "language") {
            return ISO6391.getName(filterValue.toLowerCase());
        } else if (entityId) {
            return await getEntityDisplayName(entityId, filterValue);
        } else {
            return filterValue;
        }
    }

    const getResultsCount = async function (entityType, filters) {
        const searchParams = {
            filter: filtersAsUrlStr(filters)
        }
        const url = makeUrl(entityType, searchParams)
        const ret = await getUrl(url)
        return ret.meta.count
    }

    const getGroups = async function (entityType, filterKey, options) {
        const myUrl = url.makeGroupByUrl(
            entityType,
            filterKey,
            options,
        )

        const respData = await getUrl(myUrl)
        const filteredGroups = respData.group_by.filter(g => {
            const keyIsNullish = g.key === "unknown" || g.key === null
            return !(keyIsNullish && options.hideUnknown)
        })

        // const maxGroups = (options.perPage) ? options.perPage - 1 : 25
        // const truncatedGroups = filteredGroups.splice(0, 25)
        const truncatedGroups = filteredGroups
        const groupCounts = truncatedGroups.map(g => g.count)
        const countSum = groupCounts.reduce((a, b) => a + b, 0)

        const groupDisplayFilters = truncatedGroups
            .map(group => {
                const groupKey = decodeURIComponent(group.key).replaceAll("https://metadata.un.org/sdg/", "") // namespace hack

                return createDisplayFilter(
                    entityType,
                    filterKey,
                    groupKey,
                    false,
                    group.key_display_name,
                    group.count,
                    group.count / countSum,
                )
            })

        // Year fields read most naturally in chronological order. The API returns
        // group_by buckets count-descending, which scrambles the years in the
        // "More…" picker (FilterSelectAddOption) so you can't see the data's range
        // at a glance (zd#8363). Sort year groups by year here — the card histogram
        // already depended on this ordering (it was sorted again in GroupBy.vue);
        // centralizing it keeps the histogram and the popup consistent.
        if (filterKey === "publication_year" || filterKey === "start_year") {
            groupDisplayFilters.sort((a, b) => parseInt(b.value) - parseInt(a.value))
        }

        return groupDisplayFilters
    }

    const filterKeyFromAutocompleteResponse = function (result) {
        // this currently looks in result.filter_key but i think in the future we shoudl ignore that
        // and instead get the filterKey from the entity type, extracted from the ID?

        let filterKey
        if (result.filter_key === "id") filterKey = "ids.openalex"
        else if (result.filter_key === "topics.id") filterKey = "primary_topic.id"
        else filterKey = result.filter_key
        return filterKey
    }

    const getAutocompleteResponses = async function (entityType, filterKey, searchString) {
        //console.log("getAutocompleteResponses", entityType, filterKey, searchString)
        if (!filterKey && entityType !== "works") {
            filterKey = "ids.openalex"
        }

        const facetConfig = getFacetConfig(entityType, filterKey)

        // Countries aren't a native OpenAlex autocomplete entity:
        // /autocomplete/countries 404s ("OpenAlex ID format not recognized"),
        // so typing in a country filter surfaced no matches (zd#7567 — broke
        // only in Basic Filter Style, which routes typed input here; the
        // no-text state uses getGroups() and was fine). Search the static
        // country list locally instead, shaping each hit exactly like
        // getGroups() does (same /countries/<code> key → identical .value via
        // createFilterValue) so selection state and the stored filter match.
        if (facetConfig?.isCountry) {
            const term = (searchString || "").trim().toLowerCase()
            return openAlexCountries
                .filter(c => c.id !== "unknown")
                .filter(c => !term ||
                    c.display_name.toLowerCase().includes(term) ||
                    c.id.toLowerCase().includes(term))
                .slice(0, 10)
                .map(c => createDisplayFilter(
                    entityType,
                    filterKey,
                    `https://openalex.org/countries/${c.id}`,
                    false,
                    c.display_name,
                    c.works_count,
                    undefined,
                ))
        }

        const filterValueEntityId = facetConfig?.entityToSelect

        const myUrl = url.makeAutocompleteUrl(filterValueEntityId, searchString)
        const resp = await getUrl(myUrl)
        const suggestionFilters = resp.results
            .filter(r => !!r.id)
            .filter(r => r.entity_type !== "filter")
            .filter(r => !!r.display_name)
            .map(result => {
                const resultFilterKey = filterKey ?? filterKeyFromAutocompleteResponse(result) //
                // console.log("getAutocompleteResponses() map() resultFilterKey", resultFilterKey)

                const myFilter = createSimpleFilter(
                    entityType,
                    resultFilterKey,
                    result.id
                )
                // console.log("getAutocompleteResponses() map() myFilter", entityType, resultFilterKey, myFilter)

                const myHintVerb = myFilter.entityToSelect ? getEntityConfig(myFilter.entityToSelect)?.hintVerb : "-"
                const myHintString = result.hint ?? ""
                let tidyHintString = myHintString
                if (myFilter.entityToSelect === "topics") {
                    tidyHintString = tidyHintString
                        .replace("This cluster of papers ", "")
                        .replace("covers a ", "")
                        .replace("focuses on ", "")
                        .replace("explores the ", "")
                        .replace(/^the/, "")
                        .split(".")[0]

                    tidyHintString = tidyHintString.split(", including ")[0]
                    tidyHintString = tidyHintString.split(", emphasizing ")[0]
                    tidyHintString = tidyHintString.split(", particularly focusing ")[0]
                    tidyHintString = tidyHintString.split(", focusing on ")[0]
                    tidyHintString = tidyHintString.split(", particularly emphasizing ")[0]
                    tidyHintString = tidyHintString.split(", with a particular emphasis on ")[0]
                    tidyHintString = tidyHintString[0].toUpperCase() + tidyHintString.substring(1) + "."
                }

                const hint = tidyHintString ?
                    myHintVerb + " " + tidyHintString :
                    ""

                return {
                    ...myFilter,
                    displayValue: result.display_name,
                    worksCount: result.works_count,
                    count: result.works_count,
                    hint,
                    isFromAutocomplete: true,
                }

            })
        return suggestionFilters
    }

    const getSuggestions = async function (entityType, filterKey, searchString, filters) {
        //console.log("getSuggestions", entityType, filterKey, searchString)
        // Collections live in users-api, not in any elastic-api group_by / autocomplete.
        // Pull from the collections.store (one /me/collections fetch covers it — cap 100)
        // and filter to the current entity_type so a `works` SERP only sees
        // works collections.
        if (filterKey === 'collection') {
            if (!store.state.collections?.loaded && !store.state.collections?.loading) {
                await store.dispatch('collections/fetchAll');
            }
            const term = (searchString || '').trim().toLowerCase();
            const all = store.state.collections?.collections || [];
            return all
                .filter(l => l.entity_type === entityType)
                .filter(l => {
                    if (!term) return true;
                    const name = (l.display_name || '').toLowerCase();
                    const desc = (l.description || '').toLowerCase();
                    return name.includes(term) || desc.includes(term);
                })
                .sort((a, b) =>
                    (a.display_name || '').localeCompare(b.display_name || '', undefined, { sensitivity: 'base' })
                )
                .map(l => ({ value: l.id, displayValue: l.display_name }));
        }
        if (!searchString) {
            return await getGroups(entityType, filterKey, {
                searchString,
                filters,
            })
        } else if (!filterKey) {
            return await getAutocompleteResponses(entityType, filterKey, searchString, filters)
        } else {
            const myEntityId = getFacetConfig(entityType, filterKey)?.entityToSelect
            const isAutocompleteEndpointAvailable = myEntityId ? getEntityConfig(myEntityId)?.hasAutocomplete : false
            if (isAutocompleteEndpointAvailable && myEntityId) {
                return await getAutocompleteResponses(entityType, filterKey, searchString, filters)
            } else {
                return await getGroups(entityType, filterKey, {
                    searchString,
                    filters
                })
            }

        }
    };

    const getAutocomplete = async function(entityType, params) {
        const response = await get(`/autocomplete/${entityType}`, params);
        //console.log("getAutocomplete", response);
        return response.results;
    };

    // Cross-type collection filter (oxjob #273): the user's collections that can
    // be used as a VALUE of `filterKey` on this SERP — i.e. collections whose
    // entity_type matches the field's selected entity type. Pulled from the
    // collections.store (one /me/collections fetch, cap 100); type-match + search
    // + sort are pure (see collectionFilter.js). Returns [] for fields with no
    // matching collections, which lets callers self-scope ("no collections → no
    // Collections tab"). The dedicated `collection` field keeps its own picker
    // path in getSuggestions; this is for every OTHER selectEntity field.
    const getCollectionSuggestionsForField = async function (entityType, filterKey, searchString) {
        const selectType = collectionMatchType(entityType, filterKey);
        if (!selectType) return [];
        if (!store.state.collections?.loaded && !store.state.collections?.loading) {
            await store.dispatch('collections/fetchAll');
        }
        const all = store.state.collections?.collections || [];
        return filterCollectionsForField(all, selectType, searchString);
    };

    // Resolve a collection id (`col_<base58>`) to its display name (oxjob #367,
    // for "<subject> is in collection <name>" OQL rendering). Collections live in
    // users-api, not elastic-api, so read from the collections.store cache (one
    // /me/collections fetch, cap 100). Returns null if not found.
    const getCollectionDisplayName = async function (colId) {
        if (!store.state.collections?.loaded && !store.state.collections?.loading) {
            await store.dispatch('collections/fetchAll');
        }
        const all = store.state.collections?.collections || [];
        return all.find(c => c.id === colId)?.display_name ?? null;
    };

    const createExport = async function(query, email) {
        // Initiates a data export to CSV via the user API
        // The query object should contain filter params
        const params = new URLSearchParams();
        if (query.filter) params.set('filter', query.filter);
        if (query.format) params.set('format', query.format);
        if (email) params.set('email', email);
        
        const url = `${urlBase.userApi}/export/works?${params.toString()}`;
        const resp = await axios.get(url, axiosConfig({userAuth: true}));
        return resp;
    }

    const getQuery = async function(params) {
        // Translate a query to all formats: { oxurl, oql, oql_render, oqo, validation }.
        // Addresses the /query resource by one representation (oxurl, oqo, or oql); see oxjob #372.
        // params: { entity_type, filter, sort, query, oqo, oql }
        //   query = a bag of any extra oxurl querystring params (search, search.*, …),
        //   so the OQL render reflects the WHOLE query, not just filter/sort.
        let path;
        if (params.oql != null) {
            path = `oql/${encodeURIComponent(params.oql)}`;
        } else if (params.oqo) {
            const oqoStr = typeof params.oqo === 'string' ? params.oqo : JSON.stringify(params.oqo);
            path = `oqo/${encodeURIComponent(oqoStr)}`;
        } else {
            const entityType = params.entity_type || 'works';
            const queryParams = new URLSearchParams();
            if (params.filter) queryParams.set('filter', params.filter);
            if (params.sort) queryParams.set('sort', params.sort);
            if (params.query && typeof params.query === 'object') {
                for (const [k, v] of Object.entries(params.query)) {
                    if (v != null && v !== '') queryParams.set(k, v);
                }
            }
            const qs = queryParams.toString();
            const oxurlValue = qs ? `${entityType}?${qs}` : entityType;
            path = `oxurl/${encodeURIComponent(oxurlValue)}`;
        }
        const url = `${urlBase.api}/query/${path}`;
        const resp = await axios.get(url, axiosConfig());
        return resp.data;
    }

    const executeOql = async function(oql) {
        // Submit an OQL string to be parsed → executed → results (oxjob #373).
        // POSTs to the API root (the execute surface shipped in #372), which has
        // no request-line cap — so even long/expressive OQL runs. The response is
        // the normal {meta, results, group_by} envelope PLUS the private
        // meta.x_query = {oql, oqo, url} triple the client rehydrates from.
        // Throws on a 4xx with a structured {validation: {errors: [...]}} body.
        const url = `${urlBase.api}/?mailto=ui@openalex.org`;
        const resp = await axios.post(url, { oql }, axiosConfig());
        return resp.data;
    }

    const discoverWorks = async function(query, filters = {}, count = 25) {
        // Vector search for semantically similar works
        const params = new URLSearchParams({ query, count });
        // Backend expects filter=key1:value1,key2:value2 format
        const filterParts = Object.entries(filters)
            .filter(([k, v]) => v != null && v !== '')
            .map(([k, v]) => `${k}:${v}`);
        if (filterParts.length > 0) {
            params.set('filter', filterParts.join(','));
        }
        const url = `${urlBase.api}/discover/works?${params}`;
        const resp = await axios.get(url, axiosConfig());
        return resp.data;
    }

    const discoverWorksHealth = async function() {
        // Check health of vector search endpoint
        const url = `${urlBase.api}/discover/works/health`;
        const resp = await axios.get(url, axiosConfig());
        return resp.data;
    }

    const makeDiscoverWorksUrl = function(query, filters = {}, count = 25) {
        // Build the URL for discoverWorks (useful for "View API" link)
        const params = new URLSearchParams({ query, count });
        // Backend expects filter=key1:value1,key2:value2 format
        const filterParts = Object.entries(filters)
            .filter(([k, v]) => v != null && v !== '')
            .map(([k, v]) => `${k}:${v}`);
        if (filterParts.length > 0) {
            params.set('filter', filterParts.join(','));
        }
        return `${urlBase.api}/discover/works?${params}`;
    }

    return {
        getEntityDisplayName,
        getFilterValueDisplayName,
        getUrl,
        getResultsList,
        getResultsCount,
        getEntity,
        getEntityFromCache,
        get,
        getAutocompleteResponses,
        getGroups,
        getSuggestions,
        getCollectionSuggestionsForField,
        getCollectionDisplayName,
        post,
        getAutocomplete,
        makeUrl,
        createExport,
        getQuery,
        executeOql,
        discoverWorks,
        discoverWorksHealth,
        makeDiscoverWorksUrl,
    }
})();


export {
    api,
}