<template>
  <div :style="indentationStyle" class="query-filter-leaf d-flex align-start align-center flex-grow-1">

    <!-- Path Label -->
    <span v-if="!props.isSentence" class="path-label number">
      {{ pathLabel }}.
    </span>

    <!-- Leaf Content -->
    <div class="leaf-content flex-grow-1 d-flex align-center">
      <!-- The Join Operator - and/or -->
      <span class="join-operator">
        <span v-if="isFirstFilter">{{ props.isSentence ? ' the ' : 'The&nbsp;' }} </span>
        <template v-else>
          <v-menu location="bottom">
            <template v-slot:activator="{ props: chipProps }">
              <v-chip
                text
                label
                variant="text"
                class="menu-chip"
                :style="{'border-color': buttonColorHex}"
                v-bind="chipProps"
              >
                {{ props.joinOperator }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item
                v-for="operator in ['and', 'or']"
                :key="operator"
                :active="selectedJoinOperator === operator"
                @click="selectedJoinOperator = operator"
                active-class="primary--text"
              >
                <v-list-item-title>
                  {{ operator }}
                </v-list-item-title>
              </v-list-item>
              
              <!-- Conditionally show the divider and Grouping actions -->
              <template v-if="!isSentence && (canGroupAbove || canUngroup)">
                <v-divider class="my-2"></v-divider>
                <v-list-item v-if="canGroupAbove" @click="groupWithAbove">
                  <v-list-item-title>
                    Group with Above
                  </v-list-item-title>
                </v-list-item>
                <v-list-item v-if="canUngroup" @click="ungroupFromAbove">
                  <v-list-item-title>
                    Ungroup from Above
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
        </template>
      </span>

      <!-- The Filter Key-->
      <span v-if="isSentence && isFirstOfGroup" class="no-space-paren">(&#x2060;</span>
      <span :class="{'font-weight-bold': columnConfig.type === 'boolean'}"> {{ columnConfig.displayName }}</span>

      <!-- The Filter Operator-->
      <span>
        <span v-if="columnConfig.type === 'boolean'" class="mx-1">is</span>
        <v-menu v-else location="bottom">
          <template v-slot:activator="{ props: chipProps }">
            <v-chip
              text
              label
              variant="text"
              class="menu-chip"
              :style="{'min-width': '1px !important', 'border-bottom-color': buttonColorHex}"
              @mousedown="onOperatorMouseDown"
              v-bind="chipProps" 
            >
              {{ selectedOperator ?? "select" }}
            </v-chip>
          </template>
          <v-list>
            <v-list-item
              v-for="operator in operatorOptions"
              :key="operator"
              :active="selectedOperator === operator"
              @click="selectedOperator = operator"
              active-class="primary--text"
            >
              <v-list-item-title>
                {{ operator }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </span>

      <!-- The Filter Value -->
      <!---- Entity Values ----->
      <template v-if="columnConfig.objectEntity">
        <!-- Viewing Entity Value -->
        <span v-if="selectedValue && !isEditingValue">
          <hover-menu-wrapper @action-click="deleteFilter" :active="props.isSentence">
            <query-filter-value-chip
              :column-config="columnConfig"
              :value="selectedValue"
              :is-label-filter="isLabelFilter"
              :is-editable="true"
              :subject-entity="props.subjectEntity"
              :is-sentence="props.isSentence"
              @click="restartEditingValue"
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
              location="bottom"
              location-strategy="connected"
              width="auto"
            >
              <template v-slot:activator="{ props: chipProps }">
                <v-chip
                  variant="outlined"
                  label
                  class="menu-chip px-1 pr-0 mx-1"
                  style="min-width: 1px !important;"
                  v-bind="chipProps" 
                >
                  Select a Label
                  <v-icon v-if="!props.isSentence" size="small">mdi-menu-down</v-icon>
                </v-chip>
              </template>
              <v-list>
                <v-list-item
                  v-for="label in applicableLabels"
                  :key="label.id"
                  :active="valueEditModel === label.id"
                  @click="valueEditModel = label.id; saveEditingValue(label.id)"
                  active-class="primary--text"
                >
                  <v-icon>mdi-tag-outline</v-icon>
                  <v-list-item-title class="py-3">
                    {{ label.name }}
                  </v-list-item-title>
                </v-list-item>
                <v-divider v-if="applicableLabels.length"></v-divider>
                <v-list-item
                  key="manage-labels"
                  to="/me/labels"
                >
                  <v-icon>mdi-tag-plus-outline</v-icon>
                  <v-list-item-title>Manage Labels</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <!-- Local Autocomplete -->
          <v-autocomplete
            v-else-if="localValueOptions.length"
            v-model="valueEditModel"
            :items="valueOptions"
            item-title="display_name"
            item-value="id"
            hide-details
            variant="outlined"
            :color="filterColor"
            density="compact"
            class="query-builder-input flex-grow-1"
            autofocus
            @update:menu="onMenuStateChange"
            @update:model-value="saveEditingValue" 
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
            @menu-state-change="onMenuStateChange"
            class="flex-grow-1"
            showWorkCounts
            autofocus
          />
        </template>
      </template>

      <!-- Boolean Values -->
      <span v-else-if="columnConfig.type === 'boolean'">
        <hover-menu-wrapper @action-click="deleteFilter" :active="props.isSentence">
          <query-filter-value-chip
            :column-config="columnConfig"
            :subject-entity="props.subjectEntity"
            :value="selectedValue"
            :is-sentence="props.isSentence"
            @click="selectedValue = !selectedValue" />
        </hover-menu-wrapper>
      </span>

      <!-- Related to Text -->
      <template v-else-if="columnConfig.id === 'related_to_text'">
        <!-- Only render dialog when needed -->
        <v-dialog
          v-if="relatedToTextDialogOpen"
          v-model="relatedToTextDialogOpen"
          max-width="600px"
          persistent
        >
          <v-card>
            <v-card-title class="text-h5">
              Find {{ props.subjectEntity }} related to the text:
            </v-card-title>
            <v-card-text>
              <v-textarea
                v-model="valueEditModel"
                variant="outlined"
                color="catWorksDarker"
                rows="10"
                autofocus
                @keydown.escape.stop="cancelRelatedTextEdit"
              ></v-textarea>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn 
                variant="text" 
                @click="cancelRelatedTextEdit"
              >
                Cancel
              </v-btn>
              <v-btn 
                color="primary" 
                variant="flat" 
                @click="saveRelatedTextEdit"
                :disabled="!valueEditModel"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <hover-menu-wrapper v-else @action-click="deleteFilter" :active="props.isSentence">
          <query-filter-value-chip 
            v-if="selectedValue !== null && !isEditingValue"
            :column-config="columnConfig"
            :subject-entity="props.subjectEntity"
            :value="selectedValue"
            :is-sentence="props.isSentence"
            @click="startEditingValue"
          />
        </hover-menu-wrapper> 
      </template>

      <!-- Number, String, Array Values -->
      <template v-else-if="['number', 'string', 'array'].includes(columnConfig.type)">
        <v-text-field
          v-if="isEditingValue || selectedValue === null"
          v-model="valueEditModel"
          density="compact"
          variant="outlined"
          class="query-builder-input flex-grow-1"
          :color="filterColor"
          hide-details
          autofocus
          @keydown.escape="cancelEditingValue"
          @blur="onInputBlur"
          @keydown.enter="saveEditingValue(valueEditModel)"
        >
        </v-text-field>
        <hover-menu-wrapper v-else @action-click="deleteFilter" :active="props.isSentence">
          <query-filter-value-chip 
            :column-config="columnConfig"
            :value="selectedValue"
            :is-sentence="props.isSentence"
            @click="startEditingValue" />
        </hover-menu-wrapper>
      </template>

      <span v-if="isSentence && isLastOfGroup" class="no-space-paren">&#x2060;)</span>

    </div>

    <!-- Delete Button -->
    <v-btn v-if="!props.isSentence" icon variant="plain" size="small" @click="deleteFilter" class="mt-1">
      <v-icon>mdi-close</v-icon>
    </v-btn>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import _ from "lodash";
import axios from "axios";

import { getConfigs, getColumnConfig } from "@/oaxConfigs";

import QueryFilterValueChip from "@/components/Query/QueryFilterValueChip.vue";
import EntityAutocomplete from "@/components/EntityAutocomplete.vue";
import HoverMenuWrapper from "@/components/Misc/HoverMenuWrapper.vue";

defineOptions({ name: "QueryFilterTreeLeaf" });

const props = defineProps({
  column_id: String,
  operator: String,
  joinOperator: { type: String, default: "and" },
  path: Array,
  value: [String, Number, Boolean],
  subjectEntity: String,
  canGroupAbove: Boolean,
  canUngroup: Boolean,
  isSentence: Boolean,
  isFirstOfGroup: Boolean,
  isLastOfGroup: Boolean,
});

const emit = defineEmits([
  "setValue",
  "setOperator",
  "deleteFilter",
  "setJoinOperator",
  "groupWithAbove",
  "ungroupFromAbove"
]);

const store = useStore();

const asyncValueOptions = ref([]);
const search = ref("");
const isLoading = ref(false);
const isEditingValue = ref(false);
const valueEditModel = ref(null);
const labelOperators = ["matches any item in label", "matches every item in label"];
const labelMenuOpen = ref(false);
const relatedToTextDialogOpen = ref(false);
const operatorClickInProgress = ref(false);
const focusSettling = ref(true);
const isMenuOpen = ref(false);

const columnConfig   = computed(() => getColumnConfig(props.subjectEntity, props.column_id));
const isLabelFilter  = computed(() => labelOperators.includes(selectedOperator.value));
const isFirstFilter  = computed(() => props.path.every(i => i === 0));
const buttonColorHex = computed(() => "#aaa");

const filterColor = computed(() => {
  return (['works', 'summary'].includes(props.subjectEntity) || columnConfig.value.id.includes("("))
    ? "catWorksDarker"
    : "catEntityDarker";
});

const pathLabel = computed(() => {
  let label = (props.path[0] + 1).toString();
  for (let i = 1; i < props.path.length; i++) {
    if (props.path[i] !== 0) {
      label += "." + props.path[i];
    }
  }
  return label;
});

const indendationLevel = computed(() => pathLabel.value.split(".").length);

const indentationStyle = computed(() => {
  if (props.isSentence) { return {}; }
  return {
    paddingLeft: `${(indendationLevel.value - 1) * 15}px`
  };
});

const operatorOptions = computed(() => columnConfig.value.operators);

const localValueOptions = computed(() => {
  if (!columnConfig.value.objectEntity) return [];
  return getConfigs()[columnConfig.value.objectEntity]?.values ?? [];
});

const valueOptions = computed(() => {
  return localValueOptions.value.length ? localValueOptions.value : asyncValueOptions.value;
});

const selectedOperator = computed({
  get: () => props.operator ?? columnConfig.value.defaultOperator,
  set: (newValue) => {
    const oldValue = props.operator;
    if (labelOperators.includes(newValue) !== labelOperators.includes(oldValue)) {
      restartEditingValue();
      emit("setOperator", props.path, newValue, true);
      emit("setValue", props.path, null, true);
    } else {
      emit("setOperator", props.path, newValue);
    }
    labelMenuPositionHack();
  }
});

const selectedJoinOperator = computed({
  get: () => props.joinOperator,
  set: (val) => {
    if (val !== props.joinOperator) {
      emit("setJoinOperator", props.path, val);
    }
  }
});

const selectedValue = computed({
  get: () => props.value,
  set: (val) => {
    emit("setValue", props.path, val);
  }
});

const applicableLabels = computed(() => {
  return store.getters["user/getCollectionsByType"](columnConfig.value.objectEntity);
});

function startEditingValue() {
  isEditingValue.value = true;
  valueEditModel.value = selectedValue.value;
  if (columnConfig.value.id === "related_to_text") {
    relatedToTextDialogOpen.value = true;
  }
}

function cancelEditingValue() {
  if (columnConfig.value.id === "related_to_text") {
    relatedToTextDialogOpen.value = false;
  }
  if (props.value !== null) {
    isEditingValue.value = false;
    valueEditModel.value = null;
  }
}

function restartEditingValue() {
  labelMenuPositionHack();
  isEditingValue.value = true;
  valueEditModel.value = null;
}

function saveEditingValue(val) {
  isEditingValue.value = false;
  selectedValue.value = val?.id || val;
  valueEditModel.value = null;
}

function deleteFilter() {
  emit("deleteFilter", props.path);
}

function onInputBlur() {
  if (operatorClickInProgress.value || focusSettling.value || relatedToTextDialogOpen.value || isMenuOpen.value) {
    return;
  }
  if (valueEditModel.value) {
    saveEditingValue(valueEditModel.value);
  } else if (props.value) {
    cancelEditingValue();
  } else {
    deleteFilter();
  }
}

function onOperatorMouseDown() {
  operatorClickInProgress.value = true;
  setTimeout(() => {
    operatorClickInProgress.value = false;
  }, 100);
}

function groupWithAbove() {
  emit("groupWithAbove", props.path);
}

function ungroupFromAbove() {
  emit("ungroupFromAbove", props.path);
}

function cancelRelatedTextEdit() {
  relatedToTextDialogOpen.value = false;
  if (props.value !== null) {
    isEditingValue.value = false;
    valueEditModel.value = null;
  } else {
    deleteFilter();
  }
}

function saveRelatedTextEdit() {
  relatedToTextDialogOpen.value = false;
  isEditingValue.value = false;
  selectedValue.value = valueEditModel.value;
  valueEditModel.value = null;
}

function labelMenuPositionHack() {
  labelMenuOpen.value = false;
  nextTick(() => {
    labelMenuOpen.value = true;
  });
}

function onMenuStateChange(open) {
  isMenuOpen.value = open;
}

const getAsyncValueOptions = _.debounce(async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(`https://api.openalex.org/autocomplete/${columnConfig.value.objectEntity}`, {
      params: { q: search.value }
    });
    const newOptions = response.data.results.map(r => ({ ...r, id: r.short_id }));
    const extantIds = asyncValueOptions.value.map(o => o.id);
    newOptions.forEach(r => {
      if (!extantIds.includes(r.id)) {
        asyncValueOptions.value.push(r);
      }
    });
  } catch (err) {
    console.error(`Error fetching ${columnConfig.value.objectEntity}:`, err);
    asyncValueOptions.value = [];
  } finally {
    isLoading.value = false;
  }
}, 300, { leading: true });

function focusSettledTimeout() {
  setTimeout(() => {
    focusSettling.value = false;
  }, 100);
}

onMounted(() => {
  focusSettledTimeout();
  if (columnConfig.value.id === "related_to_text" && selectedValue.value === null) {
    isEditingValue.value = true;
    relatedToTextDialogOpen.value = true;
  }
});

watch(search, (val) => {
  if (val) { getAsyncValueOptions(); }
});
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
.no-space-paren {
  display: inline-block;
  margin: 0;
  padding: 0;
  font-size: inherit;
  line-height: 0;
  vertical-align: baseline;
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