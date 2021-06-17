import axios from 'axios'
import _ from 'lodash'

export const search = {
    apiBaseUrl: "https://gtr-api.herokuapp.com/search/",
    loading: false,
    results: [],
    entities: [],
    queryEntities: [],
    selectedEntity: null,
    selectedEntityId: null,
    totalResultsCount: 0,

    query: {
        q: "",
        oa: false,
        annotations: true,
        page: 1,
        zoom: null
    },
    queryDefaults: {
        q: "",
        oa: false,
        annotations: true,
        page: 1,
        zoom: null
    },
    cachedQuery: {},


    apiQueryUrl: function(){
        return this.apiBaseUrl + this.query.q
            + "?page=" + this.query.page
            + "&oa=" + this.query.oa
        //     + "&nocache=true"
    },




    fetchResults: function(showQueryEntity){
        this.loading = true
        this.results = []
        this.queryEntities = []
        this.totalResultsCount = 0
        let request = axios.get(this.apiQueryUrl())
            .then(resp => {
                console.log("got query results back", resp.data)
                this.results = resp.data.results
                this.entities = resp.data.annotations
                this.totalResultsCount = resp.data.total_num_pubs
                this.queryEntities = resp.data.query_entities

                if (showQueryEntity && this.queryEntities.length){
                    // hack for example query
                    if (this.queryEntities[1]=="Bicycle") {
                        this.selectedEntityId = "Bicycle"

                    }
                    else {
                        this.selectedEntityId = this.queryEntities[0]
                    }


                }
            })
            .catch(e=> {
                console.log("search error", e)
            })
            .finally(() =>{
                this.loading = false
            })
        return request
    },

    setQuery(queryObj){
        Object.keys(this.queryDefaults).forEach(k => {
            let newVal = queryObj[k]
            if (newVal === "false") newVal = false

            if (typeof newVal === "string") {
                newVal = newVal.replace(/_/g, " ")
            }

            if (typeof newVal === "undefined") {
                this.query[k] = this.queryDefaults[k]
            }
            else {
                this.query[k] = newVal
            }
        })


    },

    setQ(q){
        if (q) q = q.replace(/_/g, " ")

        this.query.q = q

        // doing a new search should clear entity and zoom
        this.setZoom()
        this.setSelectedEntity()
    },

    setZoom(doi){
        // this.setSelectedEntity()
        this.query.zoom = doi
    },

    setSelectedEntity(id){
        this.selectedEntityId = id
    },
    getSelectedEntity(){

        if (!this.entities || !this.selectedEntityId){
            return null
        }
        return this.entities[this.selectedEntityId]
    },

    getQueryForUrl(){
        let ret = {}
        Object.keys(this.queryDefaults).forEach(k => {
            if (this.query[k] !== this.queryDefaults[k]) {
                ret[k] = this.query[k]
                let newVal = this.query[k]
            }
        })

        if (ret.q) {
            let cleanQuery = ret.q.toLowerCase()
            if (!ret.q.startsWith("10.")) {
              cleanQuery = _.snakeCase(cleanQuery)
            }
            ret.q = cleanQuery
        }
        return ret
    }







}
