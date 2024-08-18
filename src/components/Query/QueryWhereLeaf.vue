<template>
  <v-card flat tile class="pa-2">
    <!--        <div>{{ selectedColumnConfig }}</div>-->
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
      <template v-if="selectedColumnConfig">
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
            <v-text-field
                v-model="selectedValue"
                placeholder="Search"
                dense
                outlined
                hide-details
                class="flex-grow-1"
            />

          </template>
          <template v-else-if="selectedColumnConfig?.type === 'boolean'">
            <!-- boolean, i shall take no tea today -->
          </template>
          <template v-else-if="selectedColumnConfig?.type === 'string'">
            <v-text-field
                v-model="selectedValue"
                dense
                outlined
                hide-details
                class="flex-grow-1"
            />
          </template>
          <template v-else>
            <v-autocomplete
                v-model="selectedValue"
                :items="valueOptions"
                item-text="display_name"
                item-value="id"
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
    <!--      {{ selectedColumnConfig }}-->
    <!--    </div>-->
    <v-card-actions>
    </v-card-actions>
    <v-divider/>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {entityEndpointResults} from "@/extraConfigs";

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
    selectedColumnConfig() {
      return getConfigs()[this.myEntityType].columns[this.me.columnId]
    },
    columnOptions() {
      return Object.values(getConfigs()[this.myEntityType].columns)
    },
    isSearchColumn() {
      return this.selectedColumnConfig?.id?.endsWith(".search")
    },
    operatorOptions() {
      if (!this.selectedColumnConfig) return []
      if (this.selectedColumnConfig.type === "boolean") {
        return ["is true", "is false"]

      } else if (this.isSearchColumn) {
        return ["contains", "does not contain"]
      } else {
        return ["is", "is not"]
      }
    },
    valueOptions() {
      const objectEntityId = this.selectedColumnConfig?.entityId
      console.log("getting valueOptions", objectEntityId, entityEndpointResults)

      if (entityEndpointResults[objectEntityId]) {
        return entityEndpointResults[objectEntityId].results.map(r => ({
          id: r.id,
          display_name: r.display_name
        }))
      }

      return ["foo", "bar"]

    },
    selectedColumn: {
      get() {
        return this.me.columnId
      },
      set(value) {
        const filter = {
          ...this.me,
          operator: null,
          value: [],
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
    selectedValue: {
      get() {
        return this.me.value
      },
      set(value) {
        const filter = {
          ...this.me,
          value: value,
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