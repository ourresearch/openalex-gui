<template>
  <div>
    <!--    <div>-->
    <!--      {{ querySubjectEntityConfig.columns }}-->
    <!--    </div>-->
    <v-treeview
        :items="filtersRecursive"
        v-model="tree"
        :open.sync="openNodes"
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
        <div >
          <query-filter-tree-branch
              v-if="item.type === 'branch'"
              class="py-4"
              :filter="item"
              @set="setFilter"

          />
          <div v-else-if="item.type === 'button'" class="d-flex align-center" style="width: 100%;">
            <v-menu>
              <template v-slot:activator="{ on }">
                <v-btn
                    text
                    rounded
                    v-on="on"
                    color="primary"
                    class="py-6 my-1 pl-1 d-flex justify-end"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Add filter
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
          </div>


          <query-filter-tree-leaf
              v-else
              class="py-4"
              :filter="item"
              @set="setFilter"

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
        <v-btn
            v-if="item.type !== 'button'"
            :disabled="item.isRoot"
            icon
            @click="applyDeleteFilter(item.id)"
        >
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
      </template>

    </v-treeview>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {
  addFilterButtons,
  convertFlatToRecursive,
  makeFilterBranch,
  makeFilterButton,
  makeFilterLeaf
} from "@/components/Query/query";
import {getConfigs} from "@/oaxConfigs";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";
import {filter} from "core-js/internals/array-iteration";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";

export default {
  name: "Template",
  components: {
    QueryFilterTreeLeaf,
    QueryFilterTreeBranch,
  },
  props: {},
  data() {
    return {
      foo: 42,
      tree: [],
      openNodes: [],
      myFlatFilters: [],
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
      "querySubjectEntityConfig",
      "filtersAreDirty",

    ]),
    newFilterColumnOptions() {
      return Object.values(getConfigs()["works"].columns)
    },

    filtersRecursive() {
      return convertFlatToRecursive(this.myFlatFilters)
    },
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      // "addFilter",
      "deleteFilter",
      // "setFilter",
      "createSearch",

    ]),
    ...mapActions("user", []),
    addFilter(filter, parentId){

    },
    // deleteFilter(id){
    //
    // },
    setFilter(filter){
      console.log("set this filter from an event", filter)

    },
    addBranchFilter(buttonId) {
      // console.log("addBranchFilter")
      // const filter = makeFilterBranch("works")
      // this.addFilter({
      //   filter,
      //   parentId
      // })



      console.log("addBranchFilter", buttonId)

      const newBranchFilter = makeFilterBranch("works")
      const newButtonFilter = makeFilterButton()

      newBranchFilter.children.push(newButtonFilter.id)

      this.myFlatFilters.push(newButtonFilter)
      this.myFlatFilters.push(newBranchFilter)

      // add this filter's id to the parent's children array, second from the end
      const parent = this.myFlatFilters.find(f => f.children?.includes(buttonId))
      parent.children.splice(parent.children.length - 1, 0, newBranchFilter.id)




    },
    applyDeleteFilter(id) {
      this.deleteFilter(id)
      this.createSearch()
    },
    addLeafFilter(buttonId, columnId) {
      console.log("addLeafFilter", buttonId, columnId)
      const filter = makeFilterLeaf("works")
      filter.column_id = columnId
      this.myFlatFilters.push(filter)

      // add this filter's id to the parent's children array, second from the end
      const parent = this.myFlatFilters.find(f => f.children?.includes(buttonId))
      parent.children.splice(parent.children.length - 1, 0, filter.id)

    },

    applyFilters() {
      this.createSearch()
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "query.filters": {
      handler: function (filters) {
        this.myFlatFilters = addFilterButtons(filters)

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