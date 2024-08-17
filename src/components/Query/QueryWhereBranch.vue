<template>
  <v-card flat tile class="">
    <div>
      <query-where-leaf
          v-for="childId in me.children"
          :key="childId"
          :id="childId"
          :query-part="queryPart"
      />
    </div>
    <v-card-actions>
      <v-btn rounded @click="addChild">
        <v-icon left>mdi-filter-plus-outline</v-icon>
        Add {{ myEntityType }} filter
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {makeFilterLeaf} from "@/components/Query/query";
import QueryWhereBranch from "@/components/Query/QueryWhereBranch.vue";
import QueryWhereLeaf from "@/components/Query/QueryWhereLeaf.vue";

export default {
  name: "Template",
  components: {
    QueryWhereBranch,
    QueryWhereLeaf,
  },
  props: {
    id: Number,
    queryPart: String,
  },
  data() {
    return {
      foo: 42,
      selected: null,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "returnedEntityType"
    ]),
    me() {
      return this.myQueryPart[this.id]
    },
    myQueryPart() {
      return this.query[this.queryPart]
    },
    myEntityType() {
      return this.queryPart === "summarize_by_where" ? this.query.summarize_by : "works"
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
      "toggleSummarize",
      "toggleSortByDirection",
    ]),
    ...mapActions("search", [
      "addReturnColumn",
      "addFilter",
    ]),
    ...mapActions("user", []),
    addChild() {
      const highestId = Math.max(...Object.keys(this.myQueryPart))
      const newFilterId = highestId + 1
      const newFilter = makeFilterLeaf(newFilterId, this.id)
      this.addFilter({filter: newFilter, queryPart: this.queryPart})

      this.$store.state.search.query[this.queryPart][this.id].children.push(newFilterId)

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>