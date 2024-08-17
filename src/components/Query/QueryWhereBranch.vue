<template>
  <v-card outlined class="pa-2">
    <div>{{ me.id }}</div>
    <div>
      <query-where-leaf
          v-for="childId in me.children"
          :key="childId"
          :id="childId"
      />
    </div>
    <v-card-actions>
      <v-spacer/>
      <v-btn @click="addChild">add</v-btn>
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
      return this.query.get_works_where[this.id]
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
      "addGetWorksWhereFilter",
    ]),
    ...mapActions("user", []),
    addChild() {
      console.log("addChild", this.id, this.query.get_works_where)
      const highestId = Math.max(...Object.keys(this.query.get_works_where))
      const newFilterId = highestId + 1
      const newFilter = makeFilterLeaf(newFilterId, this.id)
      this.addGetWorksWhereFilter(newFilter)
      this.$store.state.search.query.get_works_where[this.id].children.push(newFilterId)

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