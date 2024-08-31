<template>
  <div class="d-flex align-center flex-grow-1">


<!--    <v-icon left>-->
<!--      {{ columnConfig.icon }}-->
<!--    </v-icon>-->

    <!--    The filter key-->
    <div class="font-weight-bold">
      {{ columnConfig.displayName }}
    </div>


    <!--    The filter operator-->
    <div>
      <span v-if="columnConfig.type === 'boolean'" class="px-1">is</span>
      <v-menu v-else offset-y>
        <template v-slot:activator="{ on }">
          <v-btn
              text
              v-on="on" class="font-weight-regular px-1 pr-0 mx-1"
              style="min-width: 1px !important;"
              outlined
          >
            {{ selectedOperator ?? "select" }}
            <v-icon small>mdi-menu-down</v-icon>
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
    <!--    first, entity values -->
    <div class="flex-grow-1">
      <template v-if="columnConfig.objectEntity">
        <template v-if="selectedValue">
          <query-filter-value-chip
            :column-config="columnConfig"
            :value="selectedValue"
          />
        </template>
        <template v-else>
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


      </template>

      <!--    second, boolean values -->
      <v-chip
          outlined
          v-else-if="columnConfig.type === 'boolean'"
          @click="selectedValue = !selectedValue"
      >
        <v-icon left>{{ selectedValue ? "mdi-check" : "mdi-cancel" }}</v-icon>
        {{ selectedValue }}
      </v-chip>

      <!--    third, number  values -->
      <div
          v-else-if="columnConfig.type === 'number' || columnConfig.type === 'string'"
      >
        <v-text-field
            v-if="isEditingValue"
            v-model="valueEditModel"
            dense
            rounded
            filled
            hide-details
            autofocus
            @keydown.escape="cancelEditingValue"
            @blur="cancelEditingValue"
            @keydown.enter="saveEditingValue"
        >
        </v-text-field>
        <v-btn
          v-else
          class="px-1"
          text
          style="min-width: 1px !important;"
          @click="startEditingValue"
        >
          {{ (selectedValue || "click to edit") }}
          <v-icon right>mdi-pencil-outline</v-icon>
        </v-btn>

      </div>

    </div>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {entityEndpointResults} from "@/extraConfigs";
import {getConfigs} from "@/oaxConfigs";
import axios from "axios";
import QueryFilterValueChip from "@/components/Query/QueryFilterValueChip.vue";

export default {
  name: "Template",
  components: {
    QueryFilterValueChip,
  },
  props: {
    filter: Object,
    joinOperator: String,
  },
  data() {
    return {
      foo: 42,

      // for the async autocomplete values
      asyncValueOptions: [],
      search: "",
      isLoading: false,
      isEditingValue: false,
      valueEditModel: null,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntityConfig",
    ]),
    me() {
      return this.filter
    },
    columnConfig() {

      // @todo i think we're not getting the querySubjectEntityConfig
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
    ...mapMutations("search", []),
    ...mapActions("search", [
    ]),
    setFilter(filter) {
      this.$emit("set", filter)
    },
    ...mapActions("user", []),
    startEditingValue(){
      this.isEditingValue = true
      this.valueEditModel = this.selectedValue
    },
    cancelEditingValue(){
      this.isEditingValue = false
      this.valueEditModel = null
    },
    saveEditingValue(){
      this.isEditingValue = false
      this.selectedValue = this.valueEditModel
      this.valueEditModel = null
    },
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
      this.setFilter({
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