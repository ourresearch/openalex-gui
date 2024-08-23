<template>
  <div class="d-flex align-center flex-grow-1">

    <!--    The filter key-->
    <div class="font-weight-bold">
      {{ columnConfig.displayName }}
    </div>


    <!--    The filter operator-->
    <div>
      <span v-if="columnConfig.type === 'boolean'" class="px-1">is</span>
      <v-menu v-else offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text rounded v-on="on" class="font-weight-regular px-0 mx-1">
            {{ selectedOperator ?? "select" }}
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item-group
              v-model="selectedOperator"
          >
            <v-list-item
                v-for="operator in operatorOptions"
                :key="operator"
                :value="operator"
                active-class="primary--text"
            >
              <v-list-item-title class="py-3">
                {{ operator }}
              </v-list-item-title>
            </v-list-item>

          </v-list-item-group>
        </v-list>
      </v-menu>
    </div>


    <!--    The filter value-->
    <div class="flex-grow-1">
      <template v-if="columnConfig.objectEntity">
        <v-autocomplete
            v-if="localValueOptions.length"
            v-model="selectedValue"
            :items="valueOptions"
            item-text="display_name"
            item-value="id"
            hide-details
            filled
            rounded
            dense
            class="flex-grow-1"
            autofocus
        />
        <v-autocomplete
            v-else
            v-model="selectedValue"
            :items="valueOptions"
            :loading="isLoading"
            :search-input.sync="search"
            item-text="display_name"
            item-value="id"
            filled
            rounded
            hide-details
            hide-no-data
            dense
            class="flex-grow-1"
            autofocus
        ></v-autocomplete>

      </template>
      <v-chip
          outlined
          v-else-if="columnConfig.type === 'boolean'"
          @click="selectedValue = !selectedValue"
      >
        <v-icon left>{{ selectedValue ? "mdi-check" : "mdi-cancel" }}</v-icon>
        {{ selectedValue }}
      </v-chip>
      <v-text-field
          v-else
          v-model="selectedValue"
          dense
          rounded
          filled
          hide-details
          full-width
          class="flex-grow-1"
          autofocus
      >

      </v-text-field>

    </div>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {entityEndpointResults} from "@/extraConfigs";
import {getConfigs} from "@/oaxConfigs";
import axios from "axios";

export default {
  name: "Template",
  components: {},
  props: {
    filterId: String,
    joinOperator: String,
  },
  data() {
    return {
      foo: 42,

      // for the async autocomplete values
      asyncValueOptions: [],
      search: "",
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
      "stagedFilters",
      "querySubjectEntityConfig",
    ]),
    me() {
      return this.stagedFilters.find(f => f.id === this.filterId)
    },
    columnConfig() {
      return this.querySubjectEntityConfig.columns[this.me.column_id]
    },
    isSearchColumn() {
      return this.columnConfig?.id?.endsWith(".search")
    },
    operatorOptions() {
      if (this.columnConfig.type === "boolean") {
        return ["is"]
      } else if (this.columnConfig.type === "number") {
        return ["is", "is not", "is greater than", "is less than"]
      } else if (this.columnConfig.type === "string") {
        if (this.isSearchColumn) {
          return ["contains", "does not contain"]
        } else {
          return ["is", "is not", "is in", "is not in"]
        }
      } else {
        return ["is", "is not"]
      }
    },

    localValueOptions() {
      if (!this.columnConfig.objectEntity) return []
      const values = getConfigs()[this.columnConfig.objectEntity]?.values ?? []
      return values
    },
    valueOptions() {
      return (this.localValueOptions.length) ? this.localValueOptions : this.asyncValueOptions
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
        this.setStagedFilter(filter)
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
        this.setStagedFilter(filter)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "setStagedFilter",
    ]),
    ...mapActions("user", []),
    getAsyncValueOptions: _.debounce(async function () {
      this.loading = true;
      try {
        const response = await axios.get(`https://api.openalex.org/autocomplete/${this.columnConfig.objectEntity}`, {
          params: {q: this.search}
        });

        const autocompleteSuggestions = response.data.results.map(r => {
          return {
            ...r,
            id: r.short_id,
          }
        })

        // add the new options to the existing options
        const extantIds = this.asyncValueOptions.map(o => o.id);
        autocompleteSuggestions.forEach(r => {
          if (!extantIds.includes(r.id)) {
            this.asyncValueOptions.push(r);
          }
        })

      } catch (error) {
        console.error(`Error fetching ${this.columnConfig.objectEntity}:`, error);
        this.asyncValueOptions = [];
      } finally {
        this.loading = false;
      }
    }, 300, {leading: true}),


  },
  created() {
    if (this.columnConfig.type === "boolean") {
      this.setStagedFilter({
        ...this.me,
        operator: "is",
        value: true,
      })
    } else {
      this.selectedOperator = this.operatorOptions[0]
    }
  },
  mounted() {
  },
  watch: {
    search(val){
      if (val) this.getAsyncValueOptions();
    }
  }
}
</script>

<style scoped lang="scss">

</style>