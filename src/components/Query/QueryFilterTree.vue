<template>
  <v-card flat rounded>
    <v-toolbar flat transparent>
      <v-toolbar-title class="text-h6">
        {{ subjectEntity }} filters
      </v-toolbar-title>
      <v-spacer/>
      <query-filter-tree-button
          :subject-entity="subjectEntity"
          :parent-id="null"
          @addBranchFilter="addBranchFilter"
          @addLeafFilter="addLeafFilter"
      />
<!--      <v-btn icon color="primary" @click="applyFilters">-->
<!--        <v-icon>mdi-check</v-icon>-->
<!--      </v-btn>-->
    </v-toolbar>


    <v-treeview
        :items="filtersRecursive"
        v-model="tree"
        :open.sync="openNodes"
        item-key="id"
        open-all
    >
      <!--      <template v-slot:prepend="{ item, open }">-->
      <!--      </template>-->

      <template v-slot:prepend="{item, open}">
        <span class="">
          <span class="number grey--text">
            {{ item.siblingIndex + 1 }}.
          </span>
          <span
              class="d-inline-flex justify-center"
              style="min-width: 1.6em;"
          >
            <template v-if="item.siblingIndex === 0">
              The
            </template>
            <template v-else>
              {{ item.parentOperator }}
            </template>
          </span>
        </span>
      </template>


      <template v-slot:label="{ item, open }">
        <query-filter-tree-branch
            v-if="item.type === 'branch'"
            class=""
            :filter="item"
            :is-open="open"
            @setOperator="setFilterOperator"
        />
        <query-filter-tree-leaf
            v-else
            class=""
            :filter="item"
            @set="setFilter"
        />
      </template>
      <template v-slot:append="{ item, open }">
        <div class="d-flex">
          <query-filter-tree-button
              v-if="item.type === 'branch'"
              :subject-entity="subjectEntity"
              :parent-id="item.id"
              @addBranchFilter="addBranchFilter"
              @addLeafFilter="addLeafFilter"
          />
          <v-btn
              icon
              @click="deleteFilter(item.id)"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>

        </div>
      </template>

    </v-treeview>
    <!--    <v-row style="font-size: 11px !important;">-->
    <!--      <v-col>-->
    <!--        <div class="text-h6">filters recursive</div>-->
    <!--        <pre>{{ filtersRecursive }}</pre>-->
    <!--      </v-col>-->
    <!--    </v-row>-->
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
    <v-card-text v-if="filters.length === 0" class="">
      No filters yet
    </v-card-text>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {
  cleanFilters,
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
  props: {
    subjectEntity: String,
    filters: Array,
  },
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
      return cleanFilters(this.myFlatFilters)
    },
    isDirty() {
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

    // things that update the server
    deleteFilter(id) {
      console.log("deleteFilter", id)
      this.myFlatFilters = deleteNode(this.myFlatFilters, id)
      this.applyFilters()
    },
    setFilterOperator({id, operator}) {
      console.log("setFilterOperator", id, operator)
      const filterToUpdate = this.myFlatFilters.find(f => f.id === id)
      filterToUpdate.operator = operator
      this.applyFilters()
    },
    setFilter(newFilter) {
      console.log("FilterTree setFilter()", newFilter)
      const filterToUpdate = this.myFlatFilters.find(f => f.id === newFilter.id)

      // filterToUpdate.foo = "bar"
      Object.keys(newFilter).forEach(key => {
        Vue.set(filterToUpdate, key, newFilter[key])
      })
      if (newFilter.value !== null){
        this.applyFilters()
      }
    },
    applyFilters() {
      this.setAllFilters(this.filtersToStore)
      this.createSearch()
    },


    // these only update local state
    addBranchFilter(parentId) {
      console.log("addBranchFilter to this parent: ", parentId)
      const newBranchFilter = makeFilterBranch(this.subjectEntity)
      this.addFilter(newBranchFilter, parentId)
    },
    addLeafFilter({parentId, columnId}) {
      console.log("addLeafFilter to this parent", parentId, columnId)
      const filter = makeFilterLeaf(this.subjectEntity)
      filter.column_id = columnId
      this.addFilter(filter, parentId)

    },
    addFilter(filter, parentId) {
      this.myFlatFilters.push(filter)
      // add this filter's id to the parent's children array, second from the end
      const parent = this.myFlatFilters.find(f => f.id === parentId)
      if (parent){
        parent.children.push(filter.id)
      }
      this.openNodes.push(parentId)
    },



  },
  created() {
  },
  mounted() {
  },
  watch: {
    "filters": {
      handler: function (filters) {
        const filtersCopy = _.cloneDeep(filters)
        const filtersWithCorrectSubject = filtersCopy.filter(f => {
          return f.subjectEntity === this.subjectEntity
        })

        this.myFlatFilters = filtersWithCorrectSubject
        this.openNodes = filters.map(f => f.id)


        // get the last item in the filters array:
        // const lastFilter = filters[filters.length - 1]
        // this.openNodes.push(lastFilter.id)


      },
      immediate: true
    }
  }
}
</script>

<style scoped lang="scss">
.invisible {
  visibility: hidden !important;
}

</style>