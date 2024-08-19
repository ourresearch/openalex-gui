<template>
  <v-card flat tile class="pa-2">
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
          <template v-else-if="selectedColumnConfig?.objectEntity">
            <v-autocomplete
                v-if="localValueOptions.length"
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
            <v-autocomplete
                v-else
                v-model="selectedValue"
                :items="valueOptions"
                :loading="isLoading"
                :search-input.sync="search"
                item-text="display_name"
                item-value="id"
                hide-details
                multiple
                chips
                outlined
                deletable-chips
                hide-no-data
                dense
                small-chips
                class="flex-grow-1"
            ></v-autocomplete>


          </template>
          <template v-else>
            config error?
          </template>
        </template>
      </template>


      <v-btn icon @click="deleteFilter(id)">
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </div>

    <!--    <div>-->
    <!--      {{ selectedColumnConfig }}-->
    <!--    </div>-->
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {entityEndpointResults} from "@/extraConfigs";
import axios from "axios";

export default {
  name: "Template",
  components: {},
  props: {
    id: String,
  },
  data() {
    return {
      foo: 42,
      search: "",
      asyncValueOptions: [],
      isLoading: false,
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
      return this.$store.state.search.query.filters.find(f => f.id === this.id)
    },
    selectedColumnConfig() {
      // will return null if user hasn't selected the column yet
      return getConfigs()[this.me.subjectEntity].columns[this.selectedColumn]
    },
    columnOptions() {
      return Object.values(getConfigs()[this.me.subjectEntity].columns)
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
    objectEntity() {
      return this.selectedColumnConfig?.entityId ?? this.selectedColumnConfig?.objectEntity
    },
    localValueOptions() {
      if (!this.objectEntity) return []
      if (entityEndpointResults[this.objectEntity]) {
        return entityEndpointResults[this.objectEntity].results.map(r => ({
          id: r.id,
          display_name: r.display_name
        }))
      }
      return []
    },
    valueOptions() {
      return (this.localValueOptions.length) ? this.localValueOptions : this.asyncValueOptions
    },
    selectedColumn: {
      get() {
        return this.me.column_id
      },
      set(value) {
        this.asyncValueOptions = []
        const filter = {
          ...this.me,
          operator: null,
          value: [],
          column_id: value,
        }
        this.setFilter(filter)
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
        this.setFilter(filter)
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
        this.setFilter(filter)
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
    getAsyncValueOptions: _.debounce(async function () {
      this.loading = true;
      try {
        const response = await axios.get(`https://api.openalex.org/autocomplete/${this.objectEntity}`, {
          params: {q: this.search}
        });

        // add the new options to the existing options
        const extantIds = this.asyncValueOptions.map(o => o.id);
        response.data.results.forEach(r => {
          if (!extantIds.includes(r.id)) {
            this.asyncValueOptions.push(r);
          }
        })

      } catch (error) {
        console.error(`Error fetching ${this.objectEntity}:`, error);
        this.asyncValueOptions = [];
      } finally {
        this.loading = false;
      }
    }, 300, {leading: true}),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    search(val) {
      if (val) {
        this.getAsyncValueOptions();
      } else {
      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>