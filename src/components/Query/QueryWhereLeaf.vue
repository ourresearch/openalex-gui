<template>
  <v-card flat tile class="pa-2">
    <!--    <div>leaf: {{ me.id }}</div>-->
    <div class="d-flex align-center">
      <div class="mr-3 font-weight-bold">{{ me.id }}</div>
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
      <template v-if="columnConfig">
        <v-select
            v-model="selectedOperator"
            :items="operatorOptions"
            dense
            outlined
            class="mr-2 flex-shrink-1"
            hide-details
        />
        <template v-if="selectedOperator !== null && selectedOperator !== undefined">
          <template v-if="isSearchColumn">
            search
          </template>
          <template v-else-if="columnConfig?.type === 'boolean'">
            <!-- boolean, i shall take no tea today -->
          </template>
          <template v-else-if="columnConfig?.type === 'string'">
            <v-text-field
                v-model="selectedValues"
                dense
                outlined
                hide-details
                class="flex-grow-1"
            />
          </template>
          <template v-else>
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
        </template>
      </template>


      <v-btn icon @click="deleteFilter({id, queryPart})">
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </div>

    <!--    <div>-->
    <!--      {{ columnConfig }}-->
    <!--    </div>-->
    <v-card-actions>
    </v-card-actions>
    <v-divider/>
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
    queryPart: String,
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
      return this.query[this.queryPart][this.id]
    },
    myEntityType() {
      return this.queryPart === "summarize_by_where" ? this.query.summarize_by : "works"
    },
    columnConfig() {
      return getConfigs()[this.myEntityType].columns[this.me.columnId]
    },
    columnOptions() {
      return Object.values(getConfigs()[this.myEntityType].columns)
    },
    isSearchColumn() {
      return this.columnConfig?.id?.endsWith(".search")
    },
    operatorOptions() {
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
        const filter = {
          ...this.me,
          columnId: value,
        }
        this.setFilter({filter, queryPart: this.queryPart})
      },
    },
    selectedOperator: {
      get() {
        return this.me.operator
      },
      set(value) {
        const filter = {
          ...this.me,
          operator: value,
        }
        this.setFilter({filter, queryPart: this.queryPart})
      }
    },
    selectedValues: {
      get() {
        return this.me.values
      },
      set(value) {
        const filter = {
          ...this.me,
          values: value,
        }
        this.setFilter({filter, queryPart: this.queryPart})
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
      "setFilter",
      "deleteFilter"
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