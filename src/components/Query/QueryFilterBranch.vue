<template>
  <v-card flat tile class="">
    <v-toolbar dense flat>
      {{ me.children.length }} {{ "filter" | pluralize(me.children.length) }}
      <v-spacer></v-spacer>
      <v-chip-group
          v-model="operator"
          active-class="grey"
      >
        <v-chip small value="and" label class="mr-0">and</v-chip>
        <v-chip small value="or" label>or</v-chip>
      </v-chip-group>
      <v-btn icon @click="deleteChildren" :disabled="!me.children.length">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <V-divider/>

    <div
        v-for="(childId, i) in me.children"
        :key="i+'row-number'"
        class="d-flex align-center"
    >
      <div class="font-weight-bold pa-3">{{ i }}</div>
      <query-filter-leaf
          :key="childId"
          :id="childId"
      />
    </div>
    <v-card-actions>
      <v-btn rounded @click="addChild">
        <v-icon left>mdi-filter-plus-outline</v-icon>
        Add {{ me.subjectEntity }} filter
      </v-btn>
      <v-btn rounded text>
        Add group
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {makeFilterLeaf} from "@/components/Query/query";
import QueryFilterLeaf from "@/components/Query/QueryFilterLeaf.vue";

export default {
  name: "Template",
  components: {
    QueryFilterLeaf,
  },
  props: {
    id: String,
    queryPart: String,
    subjectEntity: String,
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
      return this.$store.state.search.query.filters.find(f => f.id === this.id)
    },
    myQueryPart() {
      return this.query[this.queryPart]
    },
    operator: {
      get() {
        return this.me.operator
      },
      set(value) {
        this.me.operator = value
      }
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
        "deleteFilter",
    ]),
    ...mapActions("user", []),
    addChild() {
      const filter = makeFilterLeaf(this.subjectEntity)
      this.addFilter({filter, parent: this.id})
    },
    deleteChildren() {
      this.me.children.forEach(childId => {
        this.deleteFilter(childId)
      })
    },


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