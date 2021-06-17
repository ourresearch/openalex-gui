import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const searchFiltersFactory = function(){
  return [
    {
      id: "country",
      displayName: "Country",
    },
    {
      id: "year",
      displayName: "Year",
    },
  ]
}


export default new Vuex.Store({
  state: {
    searchFilters: searchFiltersFactory(),
    searchType: "details"
  },
  mutations: {
  },
  actions: {
  },
  getters: {
    searchFilters(state){return state.searchFilters},
    searchParamsInUrlFormat(state){return state.searchFilters},

  },
  modules: {
  }
})
