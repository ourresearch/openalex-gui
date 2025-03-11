<template>
  <div :style="indentationStyle" class="d-flex align-center flex-grow-1 hover-color-3">

    <!-- Path Label -->
    <span class="path-label number grey--text">
      {{ pathLabel }}.
    </span>

    <!-- The Join Operator - and/or -->
    <span class="d-inline-flex justify-center" style="min-width: 1.6em; margin-right: 5px; flex-shrink: 0;">
      <template v-if="isFirstFilter">The</template>
      <template v-else>
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-chip
              outlined
              label
              class="font-weight-regular px-1 pr-0 mx-1"
              v-on="on"
            >
              {{ joinOperator }}
              <v-icon small>mdi-menu-down</v-icon>
            </v-chip>
          </template>
          <v-list>
            <v-list-item-group v-model="selectedJoinOperator">
              <v-list-item
                v-for="operator in ['and', 'or']"
                :key="operator"
                :value="operator"
                active-class="primary--text"
              >
                <v-list-item-title class="py-3">
                  {{ operator }}
                </v-list-item-title>
              </v-list-item>
            </v-list-item-group>
            
            <!-- Conditionally show the divider and Grouping actions -->
            <template v-if="canGroupAbove || canUngroup">
              <v-divider class="my-2"></v-divider>
              <v-list-item v-if="canGroupAbove" @click="groupWithAbove">
                <v-list-item-title class="py-3">
                  Group with Above
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-if="canUngroup" @click="ungroupFromAbove">
                <v-list-item-title class="py-3">
                  Ungroup from Above
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>
      </template>
    </span>


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
          <!-- Labels -->
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
          <!-- Local Autocomplete -->
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
              @blur="onInputBlur"
          />
          <!-- API Autocomplete -->
          <entity-autocomplete
              v-else
              v-model="valueEditModel"
              :entity-type="columnConfig.objectEntity"
              @entity-selected="saveEditingValue"
              @blur="onInputBlur"
              class="flex-grow-1"
              showWorkCounts
              autofocus
              dense
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
            @blur="onInputBlur"
            @keydown.enter="saveEditingValue(valueEditModel)"
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

    <!-- Delete Button -->
    <v-btn icon @click="deleteFilter">
      <v-icon>mdi-close</v-icon>
    </v-btn>

  </div>
</template>


<script>
import {getConfigs, getColumnConfig} from "@/oaxConfigs";
import axios from "axios";
import QueryFilterValueChip from "@/components/Query/QueryFilterValueChip.vue";
import EntityAutocomplete from '@/components/EntityAutocomplete.vue';

export default {
  name: "QueryFilterTreeLeaf",
  components: {
    QueryFilterValueChip,
    EntityAutocomplete,
  },
  props: {
    column_id: String,
    operator: String,
    joinOperator: {type: String, default: "and"},
    path: Array,
    value: [String, Number, Boolean],
    subjectEntity: String,
    canGroupAbove: Boolean,
    canUngroup: Boolean,
  },
  emits: [
    'setValue',
    'setOperator',
    'deleteFilter',
    'setJoinOperator',
    'groupWithAbove', 
    'ungroupFromAbove'
  ],
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
      return getColumnConfig(this.subjectEntity, this.column_id);
    },
    isLabelFilter() {
      return this.labelOperators.includes(this.operator);
    },
    isFirstFilter() {
      return (this.path.every(i => i === 0));
    },
    pathLabel() {
      // 1) The top-level label is always (path[0] + 1)
      let label = (this.path[0] + 1).toString();

      // 2) For each subsequent index in the path, only append if it's not zero
      for (let i = 1; i < this.path.length; i++) {
        const subIndex = this.path[i];
        if (subIndex !== 0) {
          label += "." + subIndex;
        }
      }
      return label;
    },
    indendationLevel() {
      return this.pathLabel.split(".").length;
    },
    indentationStyle() {
      return {
        paddingLeft: `${this.indendationLevel * 20}px`
      };
    },
    operatorOptions() {
      return this.columnConfig.operators;
    },
    localValueOptions() {
      if (!this.columnConfig.objectEntity) return [];
      const values = getConfigs()[this.columnConfig.objectEntity]?.values ?? [];
      return values;
    },
    valueOptions() {
      return (this.localValueOptions.length) ? this.localValueOptions : this.asyncValueOptions;
    },
    selectedOperator: {
      get() {
        return this.operator ?? this.columnConfig.defaultOperator;
      },
      set(newValue) {
        const oldValue = this.operator
        if (this.labelOperators.includes(newValue) !== this.labelOperators.includes(oldValue)) {
          // when switching between label and entity operators reset value and don't immediately apply
          //console.log("operator change to/from label")
          this.restartEditingValue();
          this.$emit("setOperator", this.path, newValue, true);
          this.$emit("setValue", this.path, null, true);
        } else {
          this.$emit("setOperator", this.path, newValue);
        }
        this.labelMenuPositionHack();
      }
    },  
    selectedJoinOperator: {
      get() {
        return this.joinOperator;
      },
      set(value) {
        if (value !== this.joinOperator) {
          this.$emit("setJoinOperator", this.path, value);
        }
      }
    },
    selectedValue: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit("setValue", this.path, value);
      }
    },
    applicableLabels() {
      const labels = this.$store.getters['user/getCollectionsByType'](this.columnConfig.objectEntity);
      return labels;
    },
  },
  methods: {
    startEditingValue() {
      this.isEditingValue = true;
      this.valueEditModel = this.selectedValue;
    },
    cancelEditingValue() {
      //console.log("cancelEditingValue")
      if (this.value !== null) {
        this.isEditingValue = false;
        this.valueEditModel = null;  
      }
    },
    restartEditingValue() {
      //console.log("restart edit")
      this.labelMenuPositionHack();
      this.isEditingValue = true;
      this.valueEditModel = null;
    },
    saveEditingValue(value) {
      //console.log("saveEditingValue: ", value)
      this.isEditingValue = false;
      // Handle both full entity objects and direct ID values
      this.selectedValue = value?.id || value;
      this.valueEditModel = null;
    },
    deleteFilter() {
      this.$emit("deleteFilter", this.path);
    },
    onInputBlur() {
      //console.log("onInputBlur", this.valueEditModel);
      if (this.valueEditModel) {
        this.saveEditingValue(this.valueEditModel);
      } else {
        this.cancelEditingValue();
      }
    },
    groupWithAbove() {
      this.$emit("groupWithAbove", this.path);
    },
    ungroupFromAbove() {
      this.$emit("ungroupFromAbove", this.path);
    },
    labelMenuPositionHack() {
      // hacked needed to allow label menu to be rendered open intially in the correct location
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
  watch: {
    search(val){
      if (val) this.getAsyncValueOptions();
    }
  }
}
</script>


<style scoped lang="scss">
.path-label {
  margin-right: 5px;
}
</style>