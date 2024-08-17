<template>
  <v-card outlined class="pa-2">
    <div>leaf: {{ me.id }}</div>
    <div class="d-flex align-center">
      <v-autocomplete
          v-model="selectedColumn"
          :items="columnOptions"
          item-text="displayName"
          item-value="id"
          label="Column"
          dense
          class="mr-2"
          hide-details
      />
      <v-select
          v-model="selectedOperator"
          :items="['is', 'is not']"
          label="Operator"
          dense
          class=""
          hide-details
      />
      <v-btn icon @click="deleteWorksWhereFilter(id)">
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </div>
    <v-combobox
        v-model="selectedValues"
        :items="['value1', 'value2']"
        label="Values"
        filled
        rounded
        class="mb-2"
        hide-details
        multiple
        chips
        deletable-chips
    />

    <div>

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
    columnOptions() {
      return Object.values(getConfigs()["works"].columns)
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