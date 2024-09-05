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
          @addFilter="addFilter"
      />
    </v-toolbar>

    <v-treeview
        :items="displayFilters"
        :open.sync="openNodes"
        open-all
    >
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
        <query-filter-tree-leaf
            class=""

            :column_id="item.column_id"
            :operator="item.operator"
            :value="item.value"
            :subject-entity="subjectEntity"

            @setOperator="(operator) => setFilterOperator(item.path, operator)"
            @setValue="(value) => setFilterValue(item.path, value)"
        />
      </template>
      <template v-slot:append="{ item, open }">
        <div class="d-flex">
          <v-btn
              icon
              @click="deleteFilter(item.path)"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>

        </div>
      </template>

    </v-treeview>
    <!--    <v-row style="font-size: 11px !important;">-->
    <!--      <v-col>-->
    <!--        <div class="text-h6">displayFilters</div>-->
    <!--        <pre>{{ displayFilters }}</pre>-->
    <!--      </v-col>-->
    <!--    </v-row>-->
        <v-row style="font-size: 11px !important;">
<!--          <v-col >-->
<!--            <div class="text-h6">Query</div>-->
<!--            <pre>{{ query.filters}}</pre>-->
<!--          </v-col>-->
          <v-col>
            <div class="text-h6">Component</div>
            <pre>{{ myFilters }}</pre>
          </v-col>
        </v-row>
    <v-card-text v-if="myFilters.length === 0" class="">
      No filters applied
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
      openNodes: [],

      myFilters: [],
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
      "querySubjectEntityConfig",

    ]),

    displayFilters() {
      return this.myFilters.map((f, i) => {
        return {
          ...f,
          id: i, // for the treeview to know which nodes are open
          path: [i], // so we can find which nodes to update and delete
          siblingIndex: i, // just for display
          parentOperator: "and", // just for display
        }

      })

    },
    filtersToStore() {
      return this.myFilters
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


    // create
    addFilter(columnId) {
      this.myFilters.push({
        column_id: columnId,
        operator: null,
        value: null,
      })
    },


    // read
    getFilterFromPath(path){
      // for now we just assume there is only a flat array of filters
      const index = path[0]
      return this.myFilters[index]
    },


    // update
    setFilterOperator(pathToFilter, operator) {
      console.log("setFilterOperator", pathToFilter, operator)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "operator", operator)
    },

    setFilterValue(pathToFilter, value) {
      console.log("setFilterValue", pathToFilter, value)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "value", value)
    },



    // delete
    deleteFilter(path){
      // for now we just assume there is only a flat array of filters
      const index = path[0]
      this.myFilters.splice(index, 1)
    },



    // apply
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
    "filters": {
      handler: function (filters) {
        this.myFilters =  _.cloneDeep(filters)
        this.openNodes = filters.map(f => f.id)
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