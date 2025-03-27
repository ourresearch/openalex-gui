<template>
  <div :style="indentationStyle" class="query-filter-leaf d-flex align-start flex-grow-1">

    <!-- Path Label -->
    <span v-if="!isSentence" class="path-label number">
      {{ pathLabel }}.
    </span>
    <span v-else-if="false">
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <span class="path-label path-label-button number cursor-pointer" v-on="on">
            ({{ pathLabel }})
          </span>
        </template>
        <v-list dense>
          <v-list-item @click="deleteFilter">
            <v-list-item-icon class="mr-2 ml-0">
              <v-icon small>mdi-close</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Remove Filter</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </span>

    <!-- Leaf Content -->
    <div class="leaf-content flex-grow-1">
      <!-- The Join Operator - and/or -->
      <span class="join-operator">
        <span v-if="isFirstFilter">{{ isSentence ? 'the' : 'The&nbsp;' }} </span>
        <template v-else>
          <v-menu offset-y>
            <template v-slot:activator="{ on }">
              <v-chip
                text
                label
                class="menu-chip"
                :style="{'border-color': buttonColorHex}"
                v-on="on"
              >
                {{ joinOperator }}
                <v-icon v-if="!isSentence" small>mdi-menu-down</v-icon>
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

      <!-- The Filter Key-->
      <span :class="{'font-weight-bold': columnConfig.type === 'boolean'}"> {{ columnConfig.displayName }}</span>

      <!-- The Filter Operator-->
      <span>
        <span v-if="columnConfig.type === 'boolean'" class="mx-1">is</span>
        <v-menu v-else offset-y>
          <template v-slot:activator="{ on }">
            <v-chip
              text
              label
              class="menu-chip"
              :style="{'min-width': '1px !important', 'border-bottom-color': buttonColorHex}"
              v-on="on" 
            >
              {{ selectedOperator ?? "select" }}
              <v-icon v-if="!isSentence" small>mdi-menu-down</v-icon>
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
      </span>

      <!-- The Filter Value-->
      <!---- Entity Values -->
      <template v-if="columnConfig.objectEntity">
        <!-- Viewing Entity Value -->
        <span v-if="selectedValue && !isEditingValue">
          <hover-menu-wrapper @action-click="deleteFilter" :active="isSentence">
            <query-filter-value-chip
              :column-config="columnConfig"
              :value="selectedValue"
              :is-label-filter="isLabelFilter"
              :is-editable="true"
              :subject-entity="subjectEntity"
              :is-sentence="isSentence"
              @click.native="restartEditingValue"
            />
          </hover-menu-wrapper>
        </span>
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
                  class="menu-chip px-1 pr-0 mx-1"
                  style="min-width: 1px !important;"
                  v-on="on" 
                >
                  Select a Label
                  <v-icon v-if="!isSentence" small>mdi-menu-down</v-icon>
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
            outlined
            :color="filterColor"
            dense
            class="query-builder-input flex-grow-1"
            autofocus
            @change="saveEditingValue" 
            @blur="onInputBlur"
          />
          <!-- API Autocomplete -->
          <entity-autocomplete
            v-else
            v-model="valueEditModel"
            :entity-type="columnConfig.objectEntity"
            :filter-color="filterColor"
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
      <span v-else-if="columnConfig.type === 'boolean'">
        <hover-menu-wrapper @action-click="deleteFilter" :active="isSentence">
          <query-filter-value-chip
            :column-config="columnConfig"
            :subject-entity="subjectEntity"
            :value="selectedValue"
            :is-sentence="isSentence"
            @click.native="selectedValue = !selectedValue" />
        </hover-menu-wrapper>
      </span>

      <!-- Related to Text -->
      <div v-else-if="columnConfig.id === 'related_to_text'" class="related-to-text-wrapper">
        <v-textarea
          v-if="isEditingValue || selectedValue === null"
          class="related-to-text-textarea"
          v-model="valueEditModel"
          dense
          outlined
          :color="filterColor"
          hide-details
          rows="3"
          auto-grow
          autofocus
          @keydown.escape="cancelEditingValue"
          @blur="onInputBlur"
          @keydown.enter.ctrl="saveEditingValue(valueEditModel)"
        >
        </v-textarea>
        <query-filter-value-chip 
          v-else
          :column-config="columnConfig"
          :subject-entity="subjectEntity"
          :value="selectedValue"
          :is-sentence="isSentence"
          @click.native="startEditingValue"
        />
      </div>

      <!-- Number, String, Array Values -->
      <template v-else-if="['number', 'string', 'array'].includes(columnConfig.type)">
        <v-text-field
          v-if="isEditingValue || selectedValue === null"
          v-model="valueEditModel"
          dense
          outlined
          :color="filterColor"
          hide-details
          autofocus
          @keydown.escape="cancelEditingValue"
          @blur="onInputBlur"
          @keydown.enter="saveEditingValue(valueEditModel)"
        >
        </v-text-field>
        <hover-menu-wrapper v-else @action-click="deleteFilter" :active="isSentence">
          <query-filter-value-chip 
            :column-config="columnConfig"
            :value="selectedValue"
            :is-sentence="isSentence"
            @click.native="startEditingValue" />
        </hover-menu-wrapper>
      </template>
    </div>

    <!-- Delete Button -->
    <v-btn v-if="!isSentence" icon small @click="deleteFilter" class="mt-1">
      <v-icon>mdi-close</v-icon>
    </v-btn>

  </div>
</template>


<script>
import {mapGetters} from "vuex";
import {getConfigs, getColumnConfig} from "@/oaxConfigs";
import axios from "axios";
import QueryFilterValueChip from "@/components/Query/QueryFilterValueChip.vue";
import EntityAutocomplete from '@/components/EntityAutocomplete.vue';
import HoverMenuWrapper from "@/components/Misc/HoverMenuWrapper.vue";

export default {
  name: "QueryFilterTreeLeaf",
  components: {
    QueryFilterValueChip,
    EntityAutocomplete,
    HoverMenuWrapper,
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
    isSentence: Boolean,
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
    ...mapGetters([
     "uiVariant",
    ]),
    columnConfig() {
      return getColumnConfig(this.subjectEntity, this.column_id);
    },
    isLabelFilter() {
      return this.labelOperators.includes(this.operator);
    },
    isFirstFilter() {
      return (this.path.every(i => i === 0));
    },
    buttonColorHex() {
      return "#aaa";
      const colorName = ['works', 'summary'].includes(this.subjectEntity) ? 'catWorksDarker' : 'catEntityDarker';
      return this.$vuetify.theme.themes.light[colorName];
    },
    filterColor() {
      if (['works', 'summary'].includes(this.subjectEntity) || this.columnConfig.id.includes("(")) {
        return "catWorksDarker";
      } else {
        return "catEntityDarker";
      }
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
      if (this.isSentence) { return {}; }
      return {
        paddingLeft: `${((this.indendationLevel-1) * 15)}px`
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
      } else if (this.value) {
        this.cancelEditingValue();
      } else {
        this.deleteFilter();
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


<style lang="scss">
.leaf-content {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}
.path-label-button:hover {
  cursor: pointer;
  text-decoration: underline;
  background-color: #eee;
}
.related-to-text-wrapper {
  width: 100%;
  flex-basis: 100% !important;
  min-width: 100%;
  
  /* Force it to be on its own line */
  &::before {
    content: "";
    width: 100%;
    display: block;
    height: 0;
    order: 1;
  }
}
.related-to-text-textarea {
  max-width: 400px;
  max-height: 130px;
  overflow-y: auto;
}
</style>