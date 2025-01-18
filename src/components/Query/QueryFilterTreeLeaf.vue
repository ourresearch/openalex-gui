<template>
  <div  class="d-flex align-center flex-grow-1 hover-color-3">

    <!--    The Filter Key-->
    <div class="font-weight-bold">
      {{ columnConfig.displayName }}
    </div>

    <!--    The Filter Operator-->
    <div>
      <span v-if="columnConfig.type === 'boolean'" class="px-1">is</span>
      <v-menu v-else offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
            outlined
            label
            class="font-weight-regular px-1 pr-0 mx-1"
            style="min-width: 1px !important;"
            v-on="on" 
          >
            {{ selectedOperator ?? "select" }}
            <v-icon small>mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item-group v-model="selectedOperator">
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

    <!-- The Filter Value-->
    <!---- Entity Values -->
    <div class="flex-grow-1">
      <template v-if="columnConfig.objectEntity">
        <!-- Viewing Entity Value -->
        <template v-if="selectedValue && !isEditingValue">
          <query-filter-value-chip
            :column-config="columnConfig"
            :value="selectedValue"
            :operator="selectedOperator"
            :is-label-filter="isLabelFilter"
            :is-editable="true"
            @click.native="restartEditingValue"
          />
        </template>
        <!-- Editing Entity Value -->
        <template v-else>
          <template v-if="isLabelFilter">
            <v-menu
              v-model="labelMenuOpen"
              :close-on-content-click="false"
              offset-y
              location-strategy="connected"
              nudge-width="0"
            >
              <template v-slot:activator="{ on }">
                <v-chip
                  outlined
                  label
                  class="font-weight-regular px-1 pr-0 mx-1"
                  style="min-width: 1px !important;"
                  v-on="on" 
                >
                  Select a Label
                  <v-icon small>mdi-menu-down</v-icon>
                </v-chip>
              </template>
              <v-list>
                <v-list-item-group v-model="valueEditModel">
                  <v-list-item
                    v-for="label in applicableLabels"
                    :key="label.id"
                    :value="label.id"
                    active-class="primary--text"
                    @click="() => saveEditingValue(label.id)"
                  >
                    <v-list-item-icon>
                      <v-icon>mdi-tag-outline</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title class="py-3">
                      {{ label.name }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list-item-group>
                <v-divider v-if="applicableLabels.length"></v-divider>
                <v-list-item
                  key="manage-labels"
                  to="/me/labels"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-tag-plus-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>Manage Labels</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <v-autocomplete
              v-else-if="localValueOptions.length"
              v-model="valueEditModel"
              :items="valueOptions"
              item-text="display_name"
              item-value="id"
              hide-details
              filled
              rounded
              dense
              class="flex-grow-1"
              autofocus
              @change="saveEditingValue" 
              @blur="cancelEditingValue"
          />
          <v-autocomplete
              v-else
              v-model="valueEditModel"
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
              @change="saveEditingValue" 
              @blur="cancelEditingValue"
          />
        </template>
      </template>

      <!-- Boolean Values -->
      <v-chip v-else-if="columnConfig.type === 'boolean'"
          outlined
          label
          @click="selectedValue = !selectedValue"
      >
        {{ selectedValue }}
      </v-chip>

      <!-- Number, String, Array Values -->
      <div v-else-if="['number', 'string', 'array'].includes(columnConfig.type)">
        <v-text-field
            v-if="isEditingValue || selectedValue === null"
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
        <v-chip
          v-else
          outlined
          label          
          class="mr-1"
          @click="startEditingValue"
        >
          {{ (selectedValue || "click to edit") }}
          <v-icon small right>mdi-pencil-outline</v-icon>
        </v-chip>
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
  name: "QueryFilterTreeLeaf",
  components: {
    QueryFilterValueChip,
  },
  props: {
    column_id: String,
    operator: String,
    value: [String, Number, Boolean],
    subjectEntity: String,
  },
  data() {
    return {
      asyncValueOptions: [], // for the async autocomplete values
      search: "",
      isLoading: false,
      isEditingValue: false,
      valueEditModel: this.value,
      labelOperators: ["matches any item in label", "matches every item in label"],
      labelMenuOpen: false,
    }
  },
  computed: {
    columnConfig() {
      const mySubjectEntity = this.subjectEntity
      const mySubjectEntityConfig = getConfigs()[mySubjectEntity]
      const columnConfig = mySubjectEntityConfig.columns[this.column_id]
      return columnConfig
    },
    isSearchColumn() {
      return this.columnConfig?.id?.endsWith(".search")
    },
    isLabelFilter() {
      return this.labelOperators.includes(this.operator)
    },
    operatorOptions() {
      return this.columnConfig.operators
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
        return this.operator ?? this.columnConfig.defaultOperator
      },
      set(newValue) {
        const oldValue = this.operator
        if (this.labelOperators.includes(newValue) !== this.labelOperators.includes(oldValue)) {
          // when switching between label and entity operators reset value and don't immediately apply
          console.log("operator change to/from label")
          this.restartEditingValue()
          this.$emit("setOperator", newValue, true)
          this.$emit("setValue", null, true)
        } else {
          this.$emit("setOperator", newValue)
        }
        this.labelMenuPositionHack();
      }
    },
    selectedValue: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit("setValue", value)
      }
    },
    applicableLabels() {
      const labels = this.$store.getters['user/getCollectionsByType'](this.columnConfig.objectEntity)
      return labels
    },
  },
  methods: {
    setFilter(filter) {
      this.$emit("set", filter)
    },
    startEditingValue() {
      this.isEditingValue = true
      this.valueEditModel = this.selectedValue
    },
    cancelEditingValue() {
      console.log("cancelEditingValue")
      if (this.value !== null) {
        this.isEditingValue = false
        this.valueEditModel = null        
      }
    },
    restartEditingValue() {
      console.log("restart edit")
      this.labelMenuPositionHack()
      this.isEditingValue = true
      this.valueEditModel = null
    },
    saveEditingValue(value) {
      console.log("saveEditingValue: " + value)
      this.isEditingValue = false
      this.selectedValue = value
      this.valueEditModel = null
    },
    labelMenuPositionHack() {
      this.labelMenuOpen = false
      this.$nextTick(() => {
        this.labelMenuOpen = true
      })
    },
    getAsyncValueOptions: _.debounce(async function () {
      this.isLoading = true;
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
        this.isLoading = false;
      }
    }, 300, {leading: true}),
  },
  created() {
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