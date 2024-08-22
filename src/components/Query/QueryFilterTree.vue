<template>
  <div>
    <div>
    </div>
    <v-treeview
        :items="queryFiltersRecursive"
        v-model="tree"
        :open="openNodes"
        :open-on-click="true"
        item-key="id"
        dense
        open-all
    >

      <template v-slot:prepend="{ item, open }">
        <v-icon v-if="item.type === 'branch'">
          {{ open ? 'mdi-folder-open-outline' : 'mdi-folder-outline' }}
        </v-icon>
        <v-icon v-else>
          {{ querySubjectEntityConfig.columns[item.column_id].icon }}
        </v-icon>
      </template>
      <template v-slot:label="{ item, open }">
        <div class="d-flex py-4 align-center" style="width: 100%;">
          <template v-if="item.type === 'branch'">
            <div>
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

        <v-btn icon @click="deleteFilter(item.id)">
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
      "querySubjectEntity",
      "queryFiltersRecursive",
      "querySubjectEntityConfig",

    ]),
    newFilterColumnOptions() {
      return Object.values(getConfigs()["works"].columns)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "addFilter",
      "deleteFilter",
      "setFilter",

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
    addLeafFilter(parentId, columnId) {
      console.log("addLeafFilter", parentId, columnId)
      const filter = makeFilterLeaf("works")
      filter.column_id = columnId
      this.addFilter({
        filter,
        parentId
      })
    },
    setBranchFilterOperator(filter, value) {
      this.setFilter({
        ...filter,
        operator: value
      })
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