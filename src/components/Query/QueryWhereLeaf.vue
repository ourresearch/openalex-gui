<template>
  <v-card outlined class="pa-2">
    <div>leaf: {{ me.id }}</div>
    <div class="d-flex align-center">
      <v-autocomplete
          v-model="selectedColumn"
          :items="columnOptions"
          item-text="displayName"
          item-value="id"
          dense
          outlined
          class="mr-2 flex-grow-1"
          hide-details
      />
      <v-select
          v-if="columnConfig"
          v-model="selectedOperator"
          :items="operatorOptions"
          dense
          outlined
          class="mr-2 flex-shrink-1"
          hide-details
      />

      <template v-if="columnConfig?.type === 'entity'">
        <v-combobox
            v-model="selectedValues"
            :items="['value1', 'value2']"
            hide-details
            multiple
            chips
            outlined
            deletable-chips
            dense
            small-chips
            class="flex-grow-1"
        />
      </template>
      <template v-else-if="isSearchColumn">
        search
      </template>
      <template v-else-if="columnConfig?.type === 'string'">
        string
      </template>
      <template v-else-if="columnConfig?.type === 'boolean'">
        <!-- boolean, take no value -->
      </template>
      <v-btn icon @click="deleteWorksWhereFilter(id)">
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </div>

    <div>
      {{ columnConfig }}
    </div>
    <v-card-actions>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import QueryWhereBranch from "@/components/Query/QueryWhereBranch.vue";

export default {
  name: "Template",
  components: {},
  props: {
    id: Number,
  },
  data() {
    return {
      foo: 42,
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
    columnConfig(){
      return getConfigs()["works"].columns[this.me.columnId]
    },
    columnOptions() {
      return Object.values(getConfigs()["works"].columns)
    },
    isSearchColumn(){
      return this.columnConfig?.id?.endsWith(".search")
    },
    operatorOptions(){
      if (!this.columnConfig) return []
      if (this.columnConfig.type === "boolean") {
        return ["is true", "is false"]

      } else if (this.isSearchColumn) {
        return ["contains", "does not contain"]
      } else {
        return ["is", "is not"]
      }
    },
    selectedColumn: {
      get() {
        return this.me.columnId
      },
      set(value) {
        const newFilter = {
          ...this.me,
          columnId: value,
        }
        this.setGetWorksWhereFilter(newFilter)
      },
    },
    selectedOperator: {
      get() {
        return this.me.operator
      },
      set(value) {
        const newFilter = {
          ...this.me,
          operator: value,
        }
        this.setGetWorksWhereFilter(newFilter)
      }
    },
    selectedValues: {
      get() {
        return this.me.values
      },
      set(value) {
        const newFilter = {
          ...this.me,
          values: value,
        }
        this.setGetWorksWhereFilter(newFilter)
      }
    }
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
      "setGetWorksWhereFilter",
      "deleteWorksWhereFilter",
    ]),
    ...mapActions("user", []),


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