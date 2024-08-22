<template>
  <div>
    <div>
    </div>
    <v-treeview
        :items="queryFiltersRecursive"
        v-model="tree"
        :open="initiallyOpen"
        :open-on-click="true"
    >

      <template v-slot:prepend="{ item, open }">
        <v-icon v-if="item?.children">
          {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon>
        <v-icon v-else>
          mdi-filter-outline
        </v-icon>
      </template>
      <template v-slot:label="{ item, open }">
        <div class="d-flex py-4 align-center" style="width: 100%;">
          {{ item.column_id}}
          <v-spacer></v-spacer>
          <template v-if="!item.column_id">
            <v-menu>
              <template v-slot:activator="{ on }">
                <v-btn icon v-on="on">
                  <v-icon>mdi-filter-plus-outline</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="column in newFilterColumnOptions" :key="column.id"  @click="addLeafFilter(item.id, column.id)">
                  <v-list-item-title>
                    {{ column.displayName }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn icon @click="addBranchFilter(item.id)">
              <v-icon>mdi-folder-plus-outline</v-icon>
            </v-btn>
          </template>
          <v-btn icon @click="deleteFilter(item.id)">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </div>
      </template>
    </v-treeview>
    <v-divider/>
    <pre>
      {{ queryFiltersRecursive }}
    </pre>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {makeFilterBranch, makeFilterLeaf} from "@/components/Query/query";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      tree: [],
      initiallyOpen: [],
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
      "queryFiltersRecursive"

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
    addLeafFilter(parentId, columnId){
      console.log("addLeafFilter", parentId, columnId)
      const filter = makeFilterLeaf("works")
      filter.column_id = columnId
      this.addFilter({
        filter,
        parentId
      })
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