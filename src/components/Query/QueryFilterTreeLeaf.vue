<template>
  <div :style="indentationStyle" class="query-filter-leaf flex items-start items-center flex-grow">

    <!-- Path Label -->
    <span v-if="!props.isSentence" class="path-label number">
      {{ pathLabel }}.
    </span>

    <!-- Leaf Content -->
    <div class="leaf-content flex-grow flex items-center">
      <!-- The Join Operator - and/or -->
      <span class="join-operator">
        <span v-if="isFirstFilter">{{ props.isSentence ? ' the ' : 'The&nbsp;' }} </span>
        <template v-else>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button class="menu-chip border-b border-dashed px-1 hover:bg-muted" :style="{'border-color': buttonColorHex}">
                {{ props.joinOperator }}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                v-for="operator in ['and', 'or']"
                :key="operator"
                @click="selectedJoinOperator = operator"
              >
                <Check v-if="selectedJoinOperator === operator" class="h-4 w-4 mr-2" />
                <span v-else class="w-4 mr-2"></span>
                {{ operator }}
              </DropdownMenuItem>
              
              <!-- Conditionally show the divider and Grouping actions -->
              <template v-if="!isSentence && (canGroupAbove || canUngroup)">
                <DropdownMenuSeparator />
                <DropdownMenuItem v-if="canGroupAbove" @click="groupWithAbove">
                  Group with Above
                </DropdownMenuItem>
                <DropdownMenuItem v-if="canUngroup" @click="ungroupFromAbove">
                  Ungroup from Above
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </span>

      <!-- The Filter Key-->
      <span v-if="isSentence && isFirstOfGroup" class="no-space-paren">(&#x2060;</span>
      <span :class="{'font-bold': columnConfig.type === 'boolean'}"> {{ columnConfig.displayName }}</span>

      <!-- The Filter Operator-->
      <span>
        <span v-if="columnConfig.type === 'boolean'" class="mx-1">is</span>
        <DropdownMenu v-else>
          <DropdownMenuTrigger asChild>
            <button
              class="menu-chip border-b border-dashed px-1 hover:bg-muted"
              :style="{'border-bottom-color': buttonColorHex}"
              @mousedown="onOperatorMouseDown"
            >
              {{ selectedOperator ?? "select" }}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              v-for="operator in operatorOptions"
              :key="operator"
              @click="selectedOperator = operator"
            >
              <Check v-if="selectedOperator === operator" class="h-4 w-4 mr-2" />
              <span v-else class="w-4 mr-2"></span>
              {{ operator }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <DropdownMenu v-model:open="labelMenuOpen">
              <DropdownMenuTrigger asChild>
                <button class="menu-chip border rounded px-1 mx-1 hover:bg-muted flex items-center">
                  Select a Label
                  <ChevronDown v-if="!props.isSentence" class="h-4 w-4 ml-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  v-for="label in applicableLabels"
                  :key="label.id"
                  @click="valueEditModel = label.id; saveEditingValue(label.id)"
                >
                  <Tag class="h-4 w-4 mr-2" />
                  {{ label.name }}
                </DropdownMenuItem>
                <DropdownMenuSeparator v-if="applicableLabels.length" />
                <DropdownMenuItem asChild>
                  <router-link to="/me/labels" class="flex items-center">
                    <TagIcon class="h-4 w-4 mr-2" />
                    Manage Labels
                  </router-link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </template>

          <!-- Local Autocomplete -->
          <Combobox
            v-else-if="localValueOptions.length"
            v-model="valueEditModel"
            @update:modelValue="saveEditingValue"
          >
            <ComboboxAnchor class="flex-grow">
              <ComboboxInput
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search..."
                @blur="onInputBlur"
              />
            </ComboboxAnchor>
            <ComboboxContent>
              <ComboboxEmpty>No results found.</ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxItem
                  v-for="option in valueOptions"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.display_name }}
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxContent>
          </Combobox>

          <!-- API Autocomplete -->
          <entity-autocomplete
            v-else
            v-model="valueEditModel"
            :entity-type="columnConfig.objectEntity"
            :filter-color="filterColor"
            @entity-selected="saveEditingValue"
            @blur="onInputBlur"
            @menu-state-change="onMenuStateChange"
            class="flex-grow"
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
        <Dialog v-model:open="relatedToTextDialogOpen">
          <DialogContent class="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Find {{ props.subjectEntity }} related to the text:</DialogTitle>
            </DialogHeader>
            <Textarea
              v-model="valueEditModel"
              rows="10"
              class="w-full"
              @keydown.escape.stop="cancelRelatedTextEdit"
            />
            <DialogFooter>
              <Button variant="ghost" @click="cancelRelatedTextEdit">Cancel</Button>
              <Button @click="saveRelatedTextEdit" :disabled="!valueEditModel">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <hover-menu-wrapper @action-click="deleteFilter" :active="props.isSentence">
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
        <Input
          v-if="isEditingValue || selectedValue === null"
          v-model="valueEditModel"
          class="query-builder-input flex-grow h-9"
          autofocus
          @keydown.escape="cancelEditingValue"
          @blur="onInputBlur"
          @keydown.enter="saveEditingValue(valueEditModel)"
        />
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
    <Button v-if="!props.isSentence" variant="ghost" size="icon" class="h-8 w-8 mt-1" @click="deleteFilter">
      <X class="h-4 w-4" />
    </Button>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import _ from "lodash";
import axios from "axios";

import { Check, X, ChevronDown, Tag, TagIcon } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Combobox, ComboboxAnchor, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxItem } from "@/components/ui/combobox";

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