<template>
  <div>
    <!--    <div>-->
    <!--      {{ querySubjectEntityConfig.columns }}-->
    <!--    </div>-->
    <v-treeview
        :items="filtersRecursive"
        v-model="tree"
        :open="openNodes"
        :open-on-click="true"
        item-key="id"
        dense
        open-all

    >

      <!--      <template v-slot:prepend="{ item, open }">-->
      <!--        <v-icon v-if="item.type === 'branch'">-->
      <!--          -->
      <!--        </v-icon>-->
      <!--        <v-icon v-if="item.type==='leaf'">-->
      <!--          {{ querySubjectEntityConfig.columns[item.column_id].icon }}-->
      <!--        </v-icon>-->
      <!--      </template>-->


      <template v-slot:label="{ item, open }">
        <div class="d-flex py-4 align-center" style="width: 100%;">
          <template v-if="item.type === 'branch'">
            <div v-if="item.isRoot" class="text-h6 d-flex">
              Works filters ({{ query.filters.length - 1 }})
            </div>
            <div v-else>
              <span class="grey--text" v-if="item.children.length === 0">
              <v-icon>mdi-menu-down</v-icon>
                Empty subquery:
              </span>
              <span class="">{{ item.children.length }} </span>
              {{ "subfilter" | pluralize(item.children.length) }}
            </div>
            <v-spacer></v-spacer>
            <v-chip
                @click.stop="toggleBranchFilterOperator(item.id)"
                v-if="item.children.length > 1"
                outlined
                class="mr-1"
            >
              <template v-if="item.children.length === 2">
                {{ item.operator === "and" ? "Both" : "Either" }}
              </template>
              <template v-else>
                {{ item.operator === "and" ? "All" : "Any" }}
              </template>
            </v-chip>
            <v-menu>
              <template v-slot:activator="{ on }">
                <v-btn icon v-on="on">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="addBranchFilter(item.id)">
                  <v-list-item-icon>
                    <v-icon>mdi-folder-plus-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                    Add branch
                  </v-list-item-title>
                </v-list-item>
                <v-divider/>
                <v-list-item
                    v-for="column in newFilterColumnOptions"
                    :key="column.id"
                    @click="addLeafFilter(item.id, column.id)"
                >
                  <v-list-item-icon>
                    <v-icon>{{ column.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                    {{ column.displayName }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>


          <query-filter-tree-leaf
              v-else
              :filter-id="item.id"

          />

        </div>
      </template>
      <template v-slot:append="{ item, open }">

<!--        <v-btn-->
<!--            v-if="item.isRoot"-->
<!--            :disabled="!filtersAreDirty || !$store.state.search.is_ready"-->
<!--            rounded-->
<!--            @click="applyFilters"-->
<!--            color="primary"-->
<!--        >-->
<!--          Apply-->
<!--        </v-btn>-->
        <v-btn :disabled="item.isRoot" icon @click="applyDeleteFilter(item.id)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

    </v-treeview>
    <!--    <v-divider/>-->
    <!--    <pre>-->
    <!--      {{ queryFiltersRecursive }}-->
    <!--    </pre>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {makeFilterBranch, makeFilterLeaf} from "@/components/Query/query";
import {getConfigs} from "@/oaxConfigs";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "Template",
  components: {
    QueryFilterTreeLeaf,
  },
  props: {},
  data() {
    return {
      foo: 42,
      tree: [],
      openNodes: [],
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "returnedEntityType",
      "querySubjectEntity",
      "filtersRecursive",
      "querySubjectEntityConfig",
      "filtersAreDirty",

    ]),
    newFilterColumnOptions() {
      return Object.values(getConfigs()["works"].columns)
    },
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "addFilter",
      "deleteFilter",
      "setFilter",
      "createSearch",

    ]),
    ...mapActions("user", []),
    addBranchFilter(parentId) {
      console.log("addBranchFilter")
      const filter = makeFilterBranch("works")
      this.addFilter({
        filter,
        parentId
      })
    },
    applyDeleteFilter(id){
      this.deleteFilter(id)
      this.createSearch()
    },
    addLeafFilter(parentId, columnId) {
      console.log("addLeafFilter", parentId, columnId)
      const filter = makeFilterLeaf("works")
      filter.column_id = columnId
      this.addFilter({
        filter,
        parentId
      })
    },

    applyFilters() {
      this.createSearch()
    },
    toggleBranchFilterOperator(id) {
      const filter = this.query.filters.find(f => f.id === id)
      this.setFilter({
        ...filter,
        operator: filter.operator === "and" ? "or" : "and"
      })
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "query.filters": {
      handler: function (filters) {
        // get the last item in the filters array:
        const lastFilter = filters[filters.length - 1]
        this.openNodes.push(lastFilter.id)


      },
      immediate: true
    }
  }
}
</script>

<style scoped lang="scss">

</style>