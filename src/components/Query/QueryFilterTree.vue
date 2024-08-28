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

      <template v-slot:prepend="{item, open}">
        <span class="grey--text" v-if="!item.isRoot">
          {{ item.siblingIndex + 1 }}.
        </span>
        <v-icon left v-else>mdi-filter-outline</v-icon>
      </template>


      <template v-slot:label="{ item, open }">
        <query-filter-tree-branch
            v-if="item.type === 'branch'"
            class="py-2"
            :filter="item"
            @setOperator="setFilterOperator"

        />
        <query-filter-tree-button
            v-else-if="item.type === 'button'"
            class="py-2"
            :filter="item"
            @addBranchFilter="addBranchFilter"
            @addLeafFilter="addLeafFilter"
        />


        <query-filter-tree-leaf
            v-else
            class="py-2"
            :filter="item"
            @set="setFilter"

        />

      </template>
      <template v-slot:append="{ item, open }">
        <v-btn
            v-if="item.isRoot"
            :disabled="!isDirty || !$store.state.search.is_ready"
            rounded
            @click="applyFilters"
            color="primary"
        >
          Apply
        </v-btn>
        <v-btn
            v-else-if="item.type !== 'button'"
            icon
            @click="deleteFilter(item.id)"
        >
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
      </template>

    </v-treeview>
<!--    <v-row style="font-size: 11px !important;">-->
<!--      <v-col >-->
<!--        <div class="text-h6">Query</div>-->
<!--        <pre>{{ query.filters}}</pre>-->
<!--      </v-col>-->
<!--      <v-col>-->
<!--        <div class="text-h6">Component</div>-->
<!--        <pre>{{ filtersToStore }}</pre>-->
<!--      </v-col>-->
<!--    </v-row>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {
  addFilterButtons,
  convertFlatToRecursive, deleteNode,
  makeFilterBranch,
  makeFilterButton,
  makeFilterLeaf
} from "@/components/Query/query";
import {getConfigs} from "@/oaxConfigs";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";
import {filter} from "core-js/internals/array-iteration";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";
import QueryFilterTreeButton from "@/components/Query/QueryFilterTreeButton.vue";
import Vue from "vue";

export default {
  name: "Template",
  components: {
    QueryFilterTreeLeaf,
    QueryFilterTreeBranch,
    QueryFilterTreeButton,
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

    filtersRecursive() {
      return convertFlatToRecursive(this.myFlatFilters)
    },
    filtersToStore() {
      // work on a copy
      const filtersCopy = _.cloneDeep(this.myFlatFilters)

      // remove button filters
      const buttonFilters = filtersCopy.filter(f => f.type === "button")
      let noButtonFilters = filtersCopy
      buttonFilters.forEach(buttonFilter => {
        noButtonFilters = deleteNode(noButtonFilters, buttonFilter.id)
      })

      // remove useless "children" attribute from leaf nodes
      const noChildrenOnLeafNodes = noButtonFilters.map(f => {
        if (f.type === "leaf") {
          delete f.children
        }
        return f
      })

      // remove empty branches
      const noEmptyBranches = noChildrenOnLeafNodes.filter(f => f.type !== "branch" || f.children.length > 0)

      // remove UI-only attributes
      const noUiAttributes = noEmptyBranches.map(f => {
        delete f.siblingIndex
        delete f.isRoot
        return f
      })

      // done
      return noUiAttributes
    },
    isDirty(){
      return !_.isEqual(this.query.filters, this.filtersToStore)
    }
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "createSearch",
        "setAllFilters",

    ]),
    ...mapActions("user", []),
    addFilter(filter, parentId) {

    },
    deleteFilter(id){
      console.log("deleteFilter", id)
      this.myFlatFilters = deleteNode(this.myFlatFilters, id)
    },
    setFilterOperator({id, operator}) {
      console.log("setFilterOperator", id, operator)
      const filterToUpdate = this.myFlatFilters.find(f => f.id === id)
      filterToUpdate.operator = operator
    },
    setFilter(newFilter) {
      console.log("set this filter from an event", newFilter)
      const filterToUpdate = this.myFlatFilters.find(f => f.id === newFilter.id)

      // filterToUpdate.foo = "bar"
      Object.keys(newFilter).forEach(key => {
        Vue.set(filterToUpdate, key, newFilter[key])
      })

    },
    addBranchFilter(buttonId) {
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
    addLeafFilter({buttonId, columnId}) {
      console.log("addLeafFilter", buttonId, columnId)
      const filter = makeFilterLeaf("works")
      filter.column_id = columnId
      this.myFlatFilters.push(filter)

      // add this filter's id to the parent's children array, second from the end
      const parent = this.myFlatFilters.find(f => f.children?.includes(buttonId))
      parent.children.splice(parent.children.length - 1, 0, filter.id)

    },

    applyFilters() {
      this.setAllFilters(this.filtersToStore)
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