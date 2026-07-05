<template>
  <div>
    <v-menu 
      v-model="isMenuOpen"
      :location="location"
      :offset="offset"
      :close-on-content-click="false"
    >
      <template #activator="{ props }">
        <slot name="activator" :props="props" :isMenuOpen="isMenuOpen">
          <v-btn
            v-bind="props"
            :icon="buttonStyle === 'icon'"
            :size="buttonStyle === 'fab' ? 'large' : 'default'"
            :color="buttonStyle === 'fab' ? 'primary' : 'grey-darken-2'"
            :class="buttonStyle === 'fab' ? 'rounded-circle' : ''"
            :variant="buttonStyle === 'icon' ? 'text' : 'elevated'"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </slot>
      </template>

      <v-card class="selection-menu-card rounded-o" :class="{ 'selection-menu-card--tinted': !!cardStyle }" :style="cardStyle">
        <!-- TYPE-ON-CHIP mode (oxjob #561): when `externalSearch` is set the query is typed on
             the caller's own chip/input, so the menu renders NO search box — options only. -->
        <template v-if="!ext">
          <v-text-field
            v-model="searchString"
            ref="initialInput"
            variant="plain"
            hide-details
            autofocus
            :placeholder="searchPlaceholder"
            @keyup.enter="onEnter"
            @keydown.down="onDownArrow"
          >
            <template #prepend-inner>
              <v-icon color="primary" class="ml-4">mdi-magnify</v-icon>
            </template>
          </v-text-field>

          <v-divider/>
        </template>

        <v-list v-if="effSearch">
          <template v-if="searchResults.length > 0">
            <v-list-item
              v-for="(key, i) in searchResults"
              :key="key"
              :active="ext && i === hl"
              @click="selectOption(key)"
              @mousedown="onOptionMousedown"
              :disabled="disabledKeys?.includes(key)"
            >
              <template #prepend>
                <v-icon :disabled="disabledKeys?.includes(key)">{{ getIcon(key) }}</v-icon>
              </template>
              <v-list-item-title>
                {{ getDisplayName(key) }}
              </v-list-item-title>
              <template #append v-if="isStateful && selectedKeys?.includes(key)">
                <v-icon>mdi-check</v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item>
              <v-list-item-title class="text-grey">No matching options.</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>

        <v-list v-if="!effSearch">
          <v-list-item
            v-for="(key, i) in popularKeys"
            :key="key"
            :active="ext && i === hl"
            @click="selectOption(key)"
            @mousedown="onOptionMousedown"
            :disabled="disabledKeys?.includes(key)"
          >
            <template #prepend>
              <v-icon :disabled="disabledKeys?.includes(key)">{{ getIcon(key) }}</v-icon>
            </template>
            <v-list-item-title>
              {{ getDisplayName(key) }}
            </v-list-item-title>
            <template #append v-if="isStateful && selectedKeys?.includes(key)">
              <v-icon>mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-divider/>
          <v-list-item
            key="more-options"
            @click="openMoreDialog"
            @mousedown="onOptionMousedown"
          >
            <template #prepend>
              <v-icon>mdi-dots-horizontal</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">
              More
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- optional footer (e.g. a "Delete" action) — backwards-compatible: only
             renders when the caller provides the slot. (oxjob #428.) -->
        <template v-if="$slots.footer">
          <v-divider />
          <slot name="footer" :close="() => { isMenuOpen = false; }" />
        </template>
      </v-card>
    </v-menu>

    <!-- More Dialog with Multi-Column Layout -->
    <v-dialog
      v-model="isMoreDialogOpen"
      scrollable
      width="800"
    >
      <v-card rounded>
        <v-toolbar flat>
          <div class="text-h6">{{ moreDialogTitle }}</div>
          <v-spacer/>
          <v-btn icon @click="closeMoreDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-divider/>

        <v-text-field
          v-model="moreSearchString"
          variant="plain"
          hide-details
          autofocus
          placeholder="Search all"
          class="mx-4 mt-3"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-magnify</v-icon>
          </template>
        </v-text-field>

        <v-divider class="mt-3"/>

        <v-card-text class="pa-0">
          <v-list class="d-flex flex-wrap" nav>
            <v-list-item
              v-for="key in moreSearchResults"
              :key="key"
              @click="selectOption(key)"
              :disabled="disabledKeys?.includes(key) || (isStateful && selectedKeys?.includes(key))"
              style="        
                flex: 0 1 250px; 
                min-width: 0;
                align-items: flex-start;"
            >
              <template #prepend>
                <v-icon :disabled="disabledKeys?.includes(key) || (isStateful && selectedKeys?.includes(key))">{{ getIcon(key) }}</v-icon>
              </template>
              <v-list-item-title class="selection-menu-item-title">
                {{ getDisplayName(key) }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'SelectionMenu' });

const props = defineProps({
  allKeys: {
    type: Array,
    required: true
  },
  popularKeys: {
    type: Array,
    default: () => []
  },
  selectedKeys: {
    type: Array,
    default: () => []
  },
  disabledKeys: {
    type: Array,
    default: () => []
  },
  getDisplayName: {
    type: Function,
    required: true
  },
  getIcon: {
    type: Function,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search all'
  },
  moreDialogTitle: {
    type: String,
    default: 'More Options'
  },
  location: {
    type: String,
    default: 'bottom'
  },
  offset: {
    type: [Array, Object],
    default: () => [0, 0]
  },
  buttonStyle: {
    type: String,
    default: 'fab',
    validator: (value) => ['fab', 'icon'].includes(value)
  },
  isStateful: {
    type: Boolean,
    default: false
  },
  // When true, suppresses the internal flat-list "more" dialog and instead
  // emits `more` so the parent can render its own dialog. Used by AddFilter
  // to swap in the unified NoviceFilterDialog (oxjob #293).
  customMore: {
    type: Boolean,
    default: false
  },
  // Optional controlled mode (oxjob #428): parents can open/close the menu
  // programmatically via v-model:open. Leave unset for the default
  // self-managed behavior (all existing SERP usages).
  open: {
    type: Boolean,
    default: undefined
  },
  // TYPE-ON-CHIP mode (oxjob #561): non-null = the search query is typed on the caller's own
  // chip/input and passed in here; the menu renders NO search box. The caller drives keyboard
  // navigation via the exposed moveHl()/selectHl(). Leave null for the classic embedded box.
  externalSearch: {
    type: String,
    default: null
  },
  // Optional inline style for the menu card (oxjob #561: the OQL builder tints the menu with
  // its chip's colors — the card is teleported to <body>, so CSS vars don't reach it).
  cardStyle: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select', 'toggle', 'more', 'update:open']);

const isMenuOpen = ref(props.open ?? false);
watch(() => props.open, (v) => { if (v != null && v !== isMenuOpen.value) isMenuOpen.value = v; });
watch(isMenuOpen, (v) => { if (props.open != null) emit('update:open', v); });
const isMoreDialogOpen = ref(false);
const searchString = ref('');
const moreSearchString = ref('');
const initialInput = ref(null);

// Matches sort shortest-display-name-first ("TF-IDF on a budget"): when many
// fields share the query substring (institution, institutions country code,
// authorships institutions id, …) the short, general one is almost always the
// one the user wants, so it should top the list.
function searchMatches(query) {
  const q = query.toLowerCase();
  const hits = props.allKeys.filter(key =>
    props.getDisplayName(key).toLowerCase().includes(q)
  );
  if (!q) return hits;
  return hits.sort((a, b) => {
    const da = props.getDisplayName(a);
    const db = props.getDisplayName(b);
    return da.length - db.length || da.localeCompare(db);
  });
}

// type-on-chip mode (#561): the effective query comes from the caller, not the embedded box.
const ext = computed(() => props.externalSearch != null);
// In type-on mode the caller's input must KEEP focus while the user clicks an option: if the
// mousedown default runs, focus jumps into the overlay (the v-list-item), and Vuetify's
// close-time focus handling then yanks it again after selection — blurring whatever the
// caller focused next. That blur abandoned freshly-created builder drafts (oxjob #560
// Phase 2: pick a field with the MOUSE → the new draft's value box blurs → the incomplete
// draft is culled ~150ms later). Suppressing the default keeps focus outside the overlay for
// the whole click; the click itself still fires. Classic (non-ext) menus keep the old
// behavior — their focus lives in the embedded search box inside the overlay by design.
const onOptionMousedown = (e) => { if (ext.value) e.preventDefault(); };
const effSearch = computed(() => (ext.value ? (props.externalSearch || '') : searchString.value));

const searchResults = computed(() => searchMatches(effSearch.value));

const moreSearchResults = computed(() => searchMatches(moreSearchString.value));

// Keyboard highlight for type-on-chip mode (#561): focus stays on the caller's input, so the
// list is navigated remotely over whichever list is showing (results, or popular when empty).
const hl = ref(0);
const navKeys = computed(() => (effSearch.value ? searchResults.value : props.popularKeys));
watch(effSearch, () => { hl.value = 0; });
defineExpose({
  moveHl: (d) => {
    const n = navKeys.value.length;
    if (n) hl.value = ((hl.value + d) % n + n) % n;
  },
  selectHl: () => {
    const key = navKeys.value[hl.value] || navKeys.value[0];
    if (key != null && !props.disabledKeys?.includes(key)) selectOption(key);
  },
});

function selectOption(key) {
  if (props.isStateful && props.selectedKeys?.includes(key)) {
    emit('toggle', key);
  } else {
    emit('select', key);
  }
  isMenuOpen.value = false;
  isMoreDialogOpen.value = false;
  searchString.value = '';
  moreSearchString.value = '';
}

function openMoreDialog() {
  isMenuOpen.value = false;
  if (props.customMore) {
    emit('more');
    return;
  }
  isMoreDialogOpen.value = true;
}

function closeMoreDialog() {
  isMoreDialogOpen.value = false;
  moreSearchString.value = '';
}

function onDownArrow(event) {
  event.preventDefault();
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(focusable))
    .filter(el => !el.disabled && el.offsetParent !== null);
  const currentIndex = elements.indexOf(event.target);
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  } else if (elements.length > 0) {
    elements[0].focus();
  }
}

function onEnter() {
  if (searchResults.value.length === 1) {
    selectOption(searchResults.value[0]);
  }
}
</script>


<style scoped lang="scss">
.selection-menu-card {
  width: auto;
  min-width: 240px;
  max-height: 70vh;
  min-height: 200px;
  input {
    padding-top: 4px !important;
  }
  .v-field__prepend-inner, .v-field__append-inner {
    padding-top: 12px !important;
  }
}

.selection-menu-item-title {
  font-weight: normal !important;
  font-size: 16px !important;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Tinted mode (oxjob #561): a caller passed `cardStyle` (bg/fg + `--menu-hl`) — the Vuetify
   surfaces inside go transparent and inherit it so the whole menu reads as its chip's colour.
   Hover + keyboard-highlight rows use the caller's darker family shade (--menu-hl) instead of
   Vuetify's grey on-surface overlay (Jason follow-up 2026-07-05: the grey didn't feel organic). */
.selection-menu-card--tinted {
  :deep(.v-list) { background: transparent; color: inherit; }
  :deep(.v-list-item-title) { font-size: 0.8125rem !important; }
  :deep(.v-icon) { color: inherit; }
  :deep(.v-list-item__overlay) { display: none; }
  /* !important beats the global `.v-list-item.v-list-item--active { background: #f0f0f0
     !important }` house rule in App.vue (the #440 footgun). */
  :deep(.v-list-item:hover),
  :deep(.v-list-item--active) { background: var(--menu-hl, rgba(0, 0, 0, 0.08)) !important; }
}
</style>
