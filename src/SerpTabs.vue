<template>
  <div class="d-flex">
    <v-btn @click="create">create tab</v-btn>
    <v-tabs
        v-model="selectedTabIndex"
    >


    </v-tabs>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      selectedTabIndex: 0,
      tabs: [],
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    stringifiedTabs(){
      return this.tabs.map(s => JSON.stringify(s))
    },
    myTab(){
      const queryWithoutTabStuff = {}
      const tabKeys = ["selectedTab", "tabs"]
      Object.entries(this.$route.query).forEach(([k,v]) => {
        if (!tabKeys.includes(k)) {
          queryWithoutTabStuff[k] = v
        }
      })

      return {
        name: "Serp",
        params: {entityType: this.entityType},
        query: queryWithoutTabStuff
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    create() {
      const newRoute = {
        name: "Serp",
        params: {entityType: this.entityType},
        query: {
          ...this.$route.query,
          tabs: [
              ...this.stringifiedTabs,
               JSON.stringify(this.myTab),
            ].join(",")

        }
      }
      console.log("create new tab", newRoute)
      // url.pushToRoute(this.$router, newRoute)
    },

  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.tabs": {
      immediate: true,
      handler(to, from) {
        console.log("tabs just changed", to)
        this.tabs = (to) ?
            to.split(",").map(s => JSON.parse(s)) :
            []
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>