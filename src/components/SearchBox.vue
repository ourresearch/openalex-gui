<template>
  <div
    class="search-box"
    :class="{ 'search-box--focused': isFocused, 'search-box--single': singleRow, 'search-box--borderless': borderless }"
    ref="searchBoxRef"
  >
    <!-- Single-row variant (flag-on): [entity][query][xpac pill][⋮ kebab] -->
    <div v-if="singleRow" class="search-row-single d-flex align-center">
      <entity-selector-button class="ml-1" @entity-selected="focusSearchInput" />
      <textarea
        ref="inputRef"
        v-model="searchString"
        class="search-input flex-grow-1"
        :placeholder="placeholder"
        aria-label="Search scholarly works"
        :autofocus="autofocus"
        rows="1"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.escape="onEscape"
        @input="onTextareaInput"
        @paste="onTextareaPaste"
        @focus="onFocus"
        @blur="onBlur"
        autocomplete="off"
      />
      <v-btn
        v-if="searchString"
        icon
        variant="text"
        size="small"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <v-icon size="16">mdi-close</v-icon>
      </v-btn>

      <!-- xpac pill: only for works + only when xpac is on; click OPENS the kebab
           (no quick-off — toggling lives inside the kebab). Gray, not black — it's
           an indicator, not a primary action (#440 r5). -->
      <v-btn
        v-if="isWorksEntity && isXpacEnabled"
        variant="tonal"
        color="grey-darken-2"
        class="text-none xpac-pill mr-1"
        size="small"
        rounded
        @click="kebabOpen = true"
      >
        xpac
      </v-btn>

      <!-- The single-row ⋮ kebab: holds every former row-2 option. -->
      <v-menu v-model="kebabOpen" location="bottom end" :close-on-content-click="false">
        <template #activator="{ props: kebabProps }">
          <v-btn
            v-bind="kebabProps"
            icon
            variant="text"
            size="small"
            class="control-btn"
            aria-label="Search options"
          >
            <v-icon size="20">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <!-- #598 r1 (Jason): narrower list (~75% of the old content-stretched width)
             so the right-edge controls read against their row title; subtitles may
             wrap to 2 lines. The Stemming SECTION is gone — stemming is now a single
             toggle row at the bottom next to xpac (toggles = independent switches;
             checkmarks stay for the pick-one groups). -->
        <v-list v-if="isWorksEntity" density="compact" class="search-kebab-list" min-width="260" max-width="290">
          <template v-if="searchMode !== 'semantic'">
            <v-list-subheader>Search fields</v-list-subheader>
            <v-list-item @click="setField('title')">
              <v-list-item-title>Title</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="setField('title_and_abstract')">
              <v-list-item-title>Title &amp; abstract</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title_and_abstract'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="setField('all')">
              <v-list-item-title>Title, abstract, &amp; fulltext</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'all'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-divider class="my-1" />
          </template>

          <v-list-subheader>Strategy</v-list-subheader>
          <v-list-item @click="setMode('term')">
            <v-list-item-title>Boolean</v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">Keyword search with operators</v-list-item-subtitle>
            <template #append>
              <v-icon v-if="searchMode === 'term'" class="check-icon">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item @click="setMode('semantic')">
            <v-list-item-title class="d-flex align-center">
              Semantic
              <v-chip size="x-small" class="ml-2" color="grey-darken-1" variant="tonal">beta</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">AI-powered meaning search</v-list-item-subtitle>
            <template #append>
              <v-icon v-if="searchMode === 'semantic'" class="check-icon">mdi-check</v-icon>
            </template>
          </v-list-item>

          <v-divider class="my-1" />
          <!-- Independent on/off options: toggle switches, not checkmarks (#598 r1).
               The whole row is the click target; the switch itself is inert
               (pointer-events none) so a tap on it can't double-fire. -->
          <v-list-item @click="toggleXpac">
            <v-list-item-title>Include expanded index (xpac)</v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">
              192M works from lower-quality sources
            </v-list-item-subtitle>
            <template #append>
              <v-switch
                :model-value="isXpacEnabled"
                class="kebab-switch ml-3"
                density="compact"
                color="grey-darken-4"
                hide-details
                inset
                readonly
              />
            </template>
          </v-list-item>
          <v-list-item v-if="searchMode !== 'semantic'" @click="disableStemming(!stemmingDisabled)">
            <v-list-item-title>Enable stemming</v-list-item-title>
            <v-list-item-subtitle class="menu-subtitle">
              'run' also matches 'running', 'runner', etc
            </v-list-item-subtitle>
            <template #append>
              <v-switch
                :model-value="!stemmingDisabled"
                class="kebab-switch ml-3"
                density="compact"
                color="grey-darken-4"
                hide-details
                inset
                readonly
              />
            </template>
          </v-list-item>
        </v-list>
        <!-- Non-works: sparse kebab (no works-only search options). -->
        <v-list v-else density="compact" min-width="220">
          <v-list-item disabled>
            <v-list-item-title class="text-medium-emphasis">No search options</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Magnifier = submit button, at the right edge of the box (#440 r5). -->
      <v-btn
        icon
        variant="text"
        size="small"
        class="control-btn mr-1"
        aria-label="Search"
        @click="clickSubmit"
      >
        <v-icon size="20">mdi-magnify</v-icon>
      </v-btn>
    </div>

    <!-- Row 1: Input + clear (two-row variant, flag-off) -->
    <div v-if="!singleRow" class="search-row-1 d-flex align-center">
      <textarea
        ref="inputRef"
        v-model="searchString"
        class="search-input flex-grow-1"
        :placeholder="placeholder"
        aria-label="Search scholarly works"
        :autofocus="autofocus"
        rows="1"
        @keydown.enter.prevent="onEnter"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.escape="onEscape"
        @input="onTextareaInput"
        @paste="onTextareaPaste"
        @focus="onFocus"
        @blur="onBlur"
        autocomplete="off"
      />
      <v-btn
        v-if="searchString"
        icon
        variant="text"
        size="small"
        class="mr-2"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <v-icon size="16">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Autocomplete dropdown -->
    <div v-if="showDropdown" class="autocomplete-dropdown">
      <div class="autocomplete-list">
        <div
          v-for="(item, index) in suggestions"
          :key="item.id + '-' + item._acType"
          class="autocomplete-item d-flex align-center"
          :class="{ 'autocomplete-item--highlighted': index === highlightedIndex }"
          @mousedown.prevent="selectSuggestion(item)"
          @mouseenter="highlightedIndex = index"
        >
          <v-icon size="16" class="autocomplete-item-icon">{{ item._icon }}</v-icon>
          <div class="autocomplete-item-name">{{ item.display_name }}</div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div v-if="showRow2 && !singleRow" class="search-divider"></div>

    <!-- Row 2: Entity selector (left) | spacer | Combined menu (right) | Xpac toggle (far right) -->
    <div v-if="showRow2 && !singleRow" class="search-row-2 d-flex align-center">
      <entity-selector-button @entity-selected="focusSearchInput" />

      <v-spacer />

      <template v-if="isWorksEntity">
        <!-- Search options menu (fields + stemming) — hidden when semantic -->
        <v-menu v-if="searchMode !== 'semantic'" v-model="optionsMenuOpen" location="bottom end" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              size="small"
              class="control-btn"
              aria-label="Search options"
            >
              <v-icon size="18">mdi-tune-variant</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="280">
            <v-list-subheader>Search fields</v-list-subheader>

            <v-list-item @click="setField('title'); optionsMenuOpen = false">
              <v-list-item-title>Title</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="setField('title_and_abstract'); optionsMenuOpen = false">
              <v-list-item-title>Title & abstract</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'title_and_abstract'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="setField('all'); optionsMenuOpen = false">
              <v-list-item-title>Title, abstract, & fulltext</v-list-item-title>
              <template #append>
                <v-icon v-if="searchField === 'all'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-divider class="my-1" />

            <v-list-subheader>Stemming</v-list-subheader>

            <v-list-item @click="disableStemming(false)">
              <v-list-item-title>Enable stemming</v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">looking = look, looker, etc</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="!stemmingDisabled" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>

            <v-list-item @click="disableStemming(true)">
              <v-list-item-title>Disable stemming</v-list-item-title>
              <template #append>
                <v-icon v-if="stemmingDisabled" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Search strategy menu (semantic search toggle) -->
        <v-menu v-model="strategyMenuOpen" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              class="control-btn text-none ml-1"
              size="small"
            >
              <span class="control-label">{{ searchMode === 'semantic' ? 'semantic' : 'boolean' }}</span>
              <v-icon size="12" class="ml-1">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="setMode('term')">
              <v-list-item-title>Boolean</v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">Keyword search with operators</v-list-item-subtitle>
              <template #append>
                <v-icon v-if="searchMode === 'term'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
            <v-list-item @click="setMode('semantic')">
              <v-list-item-title class="d-flex align-center">
                Semantic
                <v-chip size="x-small" class="ml-2" color="grey-darken-1" variant="tonal">beta</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="menu-subtitle">
                AI-powered meaning search
              </v-list-item-subtitle>
              <template #append>
                <v-icon v-if="searchMode === 'semantic'" class="check-icon">mdi-check</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Xpac toggle -->
        <v-tooltip location="bottom" max-width="300" aria-label="Toggle expansion pack works">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :variant="isXpacEnabled ? 'flat' : 'text'"
              :color="isXpacEnabled ? '#374151' : undefined"
              class="text-none ml-1"
              :class="{ 'control-btn': !isXpacEnabled }"
              size="small"
              rounded
              @click="toggleXpac"
            >
              <span class="control-label" :style="isXpacEnabled ? 'color: white' : ''">xpac</span>
            </v-btn>
          </template>
          <span>Include 'expansion pack' works. Better coverage (192M new works from DataCite and repositories), but data quality is lower.</span>
        </v-tooltip>
      </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SearchBox' });

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import { debounce } from 'lodash';
import { getEntityConfig, getEntityConfigs } from '@/entityConfigs';
import { api } from '@/api';
import { createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr } from '@/filterConfigs';
import { url } from '@/url';
import { facetConfigs } from '@/facetConfigs';
import { extractIssn, extractOpenalexId, hasUnquotedWildcard, looksLikeOql } from '@/components/searchBox.helpers';
import { validateOql } from '@/components/OqlPlayground/oqlEditorApi';
import EntitySelectorButton from '@/components/EntitySelectorButton.vue';

const props = defineProps({
  autofocus: Boolean,
  showExamples: Boolean,
  // Flag-on (OqlSerp) layout: collapse the two-row box into one row
  // `[entity][query][⋮ kebab]`, moving every row-2 option (fields/stemming/
  // strategy/xpac) into the kebab and showing an xpac pill only when xpac is on.
  // Default false → today's two-row box (flag-off path) is byte-for-byte unchanged.
  singleRow: Boolean,
  // Embedded variant: drop the box's own border/radius/background so it can sit as
  // the (white) body of a host card — e.g. the SERP Basic-mode search card, where
  // the box is the card body and the filter chips are the card footer (#440 r3).
  borderless: Boolean,
});

// --- Identifier extraction helpers ---

function extractDoi(str) {
  if (!str) return null;
  const trimmed = str.trim();

  // URL form: https://doi.org/10.xxx or https://dx.doi.org/10.xxx (http too)
  const urlMatch = trimmed.match(/^https?:\/\/(?:dx\.)?doi\.org\/(10\..+)$/i);
  if (urlMatch) return `https://doi.org/${urlMatch[1]}`;

  // Labeled form: "DOI: 10.xxx" or "doi:10.xxx"
  const labelMatch = trimmed.match(/^doi:\s*(10\..+)$/i);
  if (labelMatch) return `https://doi.org/${labelMatch[1]}`;

  // Bare DOI: starts with 10. and contains a slash
  if (/^10\.\d{4,}/.test(trimmed) && trimmed.includes('/')) {
    return `https://doi.org/${trimmed}`;
  }

  return null;
}

function extractOrcid(str) {
  if (!str) return null;
  const trimmed = str.trim();

  // URL form: https://orcid.org/0000-...
  const urlMatch = trimmed.match(/^https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (urlMatch) return `https://orcid.org/${urlMatch[1].toUpperCase()}`;

  // Labeled form: "ORCID: 0000-..." or "orcid:0000-..."
  const labelMatch = trimmed.match(/^orcid:\s*(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (labelMatch) return `https://orcid.org/${labelMatch[1].toUpperCase()}`;

  // Bare ORCID: exactly the 4-4-4-4 pattern
  const bareMatch = trimmed.match(/^(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (bareMatch) return `https://orcid.org/${bareMatch[1].toUpperCase()}`;

  return null;
}

async function tryIdentifierLookup() {
  const input = searchString.value;

  const doi = extractDoi(input);
  if (doi) {
    try {
      const resp = await api.get('/works', { filter: `doi:${doi}`, per_page: 1, select: 'id' });
      if (resp.results && resp.results.length > 0) {
        const entityId = resp.results[0].id?.replace('https://openalex.org/', '') || resp.results[0].id;
        searchString.value = '';
        dismissDropdown();
        router.push({ name: 'EntityPage', params: { entityType: 'works', entityId } });
        return true;
      }
    } catch (e) {
      // DOI not found or API error — fall through to regular search
    }
    return false;
  }

  const orcid = extractOrcid(input);
  if (orcid) {
    try {
      const resp = await api.get('/authors', { filter: `orcid:${orcid}`, per_page: 1, select: 'id' });
      if (resp.results && resp.results.length > 0) {
        searchString.value = '';
        dismissDropdown();
        const currentFilters = filtersFromUrlStr('works', route.query.filter);
        const newFilter = createSimpleFilter('works', 'authorships.author.id', resp.results[0].id);
        url.pushNewFilters([...currentFilters, newFilter], 'works');
        return true;
      }
    } catch (e) {
      // ORCID not found or API error — fall through to regular search
    }
    return false;
  }

  // A pasted/typed OpenAlex entity ID (e.g. an author "A5017453014", or a full
  // openalex.org URL) jumps straight to that entity's page (zd#8363). Verify it
  // resolves before navigating, so an ID-shaped string that isn't a real entity
  // falls through to a normal search.
  const oaId = extractOpenalexId(input);
  if (oaId) {
    try {
      const resp = await api.getEntity(oaId.normalized);
      if (resp && resp.id) {
        const entityId = resp.id.replace('https://openalex.org/', '');
        searchString.value = '';
        dismissDropdown();
        router.push({ name: 'EntityPage', params: { entityType: oaId.entityType, entityId } });
        return true;
      }
    } catch (e) {
      // ID not found or API error — fall through to regular search
    }
    return false;
  }

  return false;
}

// --- OQL paste/type auto-detection (oxjob #598) ---
// A user handed an OQL snippet (docs, a colleague) pastes it into the Basic
// search box; running it as a literal text search returns garbage. Sniff for
// OQL shapes (cheap, local), confirm with the server /validate (the truth —
// only a VALID parse acts), then SILENTLY route to the OQL tab with the
// canonical query loaded. Session mode override only — an auto-detect is not
// an explicit mode choice, so the durable `serpMode` pref is untouched.
// Gated to the single-row (flag-on) variant, so flag-off surfaces are inert.
let oqlProbeSeq = 0;
async function tryOqlRoute() {
  if (!props.singleRow || !store.getters.featureFlags['oql']) return false;
  const text = searchString.value;
  if (!looksLikeOql(text)) return false;
  const seq = ++oqlProbeSeq;
  let res;
  try {
    res = await validateOql(text.trim());
  } catch (e) {
    return false; // validate unreachable — fall through to a normal search
  }
  // Stale probe: the box changed (more typing, a clear, a route sync) while the
  // validate round-trip was in flight — never act on the old text.
  if (seq !== oqlProbeSeq || searchString.value !== text) return false;
  if (!res?.valid || !res.oql) return false;
  searchString.value = '';
  dismissDropdown();
  store.commit('setSerpModeOverride', 'oql');
  url.pushToRoute(router, {
    name: 'OqlQuery',
    query: { oql: url.oqlForUrl(res.oql) },
  });
  return true;
}

const store = useStore();
const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();

const inputRef = ref(null);
const searchBoxRef = ref(null);
const searchString = ref('');
const searchMode = ref('term'); // 'term' or 'semantic'
const searchField = ref('title_and_abstract'); // 'all' | 'title' | 'title_and_abstract'
const stemmingDisabled = ref(false);
const isFocused = ref(false);
const strategyMenuOpen = ref(false);
const optionsMenuOpen = ref(false);
// Single-row kebab open state — also opened by clicking the xpac pill (no quick-off).
const kebabOpen = ref(false);

// Autocomplete state
const suggestions = ref([]);
const highlightedIndex = ref(-1);
const dropdownOpen = ref(false);
const isUserTyping = ref(false);
const showDropdown = computed(() => dropdownOpen.value && suggestions.value.length > 0);
const showRow2 = ref(true);
const isWorksEntity = computed(() => entityType.value === 'works');

// Entity type: read from route on Serp, store elsewhere
const entityType = computed({
  get() {
    if (route.name === 'Serp' && route.params.entityType) {
      return route.params.entityType;
    }
    return store.state.entityType;
  },
  set(to) {
    url.pushToRoute(router, {
      name: 'Serp',
      params: { entityType: to },
    });
  },
});

// Xpac toggle (route query driven)
const isXpacEnabled = computed(() => route.query.include_xpac === 'true');

function toggleXpac() {
  const newQuery = { ...route.query };
  if (isXpacEnabled.value) {
    delete newQuery.include_xpac;
  } else {
    newQuery.include_xpac = 'true';
  }
  url.pushToRoute(router, {
    name: route.name,
    params: route.params,
    query: newQuery,
  });
}

// Map searchMode + searchField + stemmingDisabled → URL search param type
const resolvedSearchType = computed(() => {
  if (!isWorksEntity.value) return 'search';
  if (searchMode.value === 'semantic') return 'search.semantic';

  // Force the no-stem (exact) field when stemming is off OR the query has a wildcard.
  const useExact = stemmingDisabled.value || hasUnquotedWildcard(searchString.value);

  const fieldMap = {
    all: useExact ? 'search.exact' : 'search',
    title: useExact ? 'search.title.exact' : 'search.title',
    title_and_abstract: useExact ? 'search.title_and_abstract.exact' : 'search.title_and_abstract',
  };
  return fieldMap[searchField.value] || 'search';
});

const placeholder = computed(() => {
  if (!isWorksEntity.value) {
    const config = getEntityConfig(entityType.value);
    return config?.placeholder || `Search ${entityType.value}`;
  }
  return 'Search 480M scholarly works';
});

// When switching to semantic, force field and stemming
watch(searchMode, (val) => {
  if (val === 'semantic') {
    searchField.value = 'title_and_abstract';
    stemmingDisabled.value = false;
  }
});

// Menu actions that auto-submit when there's a search term
function setField(value) {
  searchField.value = value;
  submitIfHasSearch();
}

function setMode(value) {
  searchMode.value = value;
  nextTick(() => {
    if (searchString.value) {
      submitSearch();
    } else if (value === 'semantic') {
      // No search term yet — still clean up incompatible filters/group_by
      cleanupForSemanticMode();
    }
  });
}

function cleanupForSemanticMode() {
  const semanticAllowedKeys = new Set(
    facetConfigs('works')
      .filter(c => c.semanticSearchAllowed && c.entityToFilter === 'works')
      .map(c => c.key)
  );

  const currentQuery = { ...route.query };
  let changed = false;

  // Strip incompatible filters
  if (currentQuery.filter) {
    const currentFilters = filtersFromUrlStr('works', currentQuery.filter);
    const compatible = currentFilters.filter(f => semanticAllowedKeys.has(f.key));
    if (compatible.length !== currentFilters.length) {
      currentQuery.filter = filtersAsUrlStr(compatible) || undefined;
      changed = true;
    }
  }

  // Clear group_by (not supported in semantic search)
  if (currentQuery.group_by) {
    delete currentQuery.group_by;
    changed = true;
  }

  if (changed) {
    url.pushToRoute(router, {
      name: route.name,
      params: route.params,
      query: currentQuery,
    });
  }
}

function disableStemming(value) {
  stemmingDisabled.value = value;
  nextTick(() => submitIfHasSearch());
}

function submitIfHasSearch() {
  if (searchString.value) {
    nextTick(() => submitSearch());
  }
}

// Autocomplete
let fetchId = 0;

function entityIcon(type) {
  return getEntityConfig(type)?.icon || 'mdi-tag-outline';
}

function countCompleteWords(str) {
  // A "complete word" is a word followed by whitespace or another word.
  // "machine learning" = 1 complete word, "machine learning " = 2, "machine learning m" = 2
  const trimmed = str.trimStart();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/);
  // If string ends with whitespace, all words are complete
  if (/\s$/.test(str)) return words.length;
  // Otherwise the last word is incomplete, so complete = total - 1
  return Math.max(0, words.length - 1);
}

function latinize(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function authorNameMatchesQuery(displayName, query) {
  // At least one query word must appear fully in the display_name (latinized, lowercased)
  const nameNorm = latinize(displayName || '').toLowerCase();
  const queryWords = latinize(query).toLowerCase().split(/\s+/).filter(Boolean);
  return queryWords.some(word => nameNorm.includes(word));
}

function dedupeByName(items) {
  const map = new Map();
  for (const item of items) {
    const key = (item.display_name || '').toLowerCase();
    const existing = map.get(key);
    if (!existing || (item.works_count || 0) > (existing.works_count || 0)) {
      map.set(key, item);
    }
  }
  return [...map.values()];
}

function topByWorksCount(items, n) {
  return [...items].sort((a, b) => (b.works_count || 0) - (a.works_count || 0)).slice(0, n);
}

async function searchEntities(entityType, query) {
  // Use the search endpoint for full-text matching (not just prefix).
  // Fetch extra results so we can filter/re-rank client-side by works_count.
  const resp = await api.get(`/${entityType}`, {
    search: query,
    per_page: 10,
    select: 'id,display_name,works_count',
  });
  return resp.results || [];
}

// Look up a source (journal) by ISSN so an ISSN-shaped query surfaces the
// matching journal directly in the dropdown (zd#8095), the way DOI/ORCID jump
// to their entity. Returns the source result or null.
async function lookupSourceByIssn(issn) {
  try {
    const resp = await api.get('/sources', {
      filter: `issn:${issn}`,
      per_page: 1,
      select: 'id,display_name,works_count',
    });
    return (resp.results && resp.results[0]) || null;
  } catch (e) {
    return null;
  }
}

async function fetchSuggestions(query) {
  if (!query || query.length === 0) {
    suggestions.value = [];
    dropdownOpen.value = false;
    return;
  }
  const id = ++fetchId;
  const currentEntity = entityType.value;
  const config = getEntityConfig(currentEntity);

  // Kick off an ISSN→journal lookup in parallel; merged into the dropdown below.
  const issn = extractIssn(query);
  const issnSourcePromise = issn ? lookupSourceByIssn(issn) : null;

  const tag = (items, type) =>
    dedupeByName(items || []).map(item => ({
      ...item,
      _acType: type,
      _icon: entityIcon(type),
    }));

  if (currentEntity === 'works') {
    // Works SERP: suggest authors, institutions, keywords (as filters) + work titles
    const calls = [
      searchEntities('authors', query),
      searchEntities('institutions', query),
      api.getAutocomplete('keywords', { q: query }),
    ];
    const includeWorks = countCompleteWords(query) >= 3;
    if (includeWorks) {
      calls.push(api.getAutocomplete('works', { q: query }));
    }

    const settled = await Promise.allSettled(calls);
    if (id !== fetchId) return;

    let authors = settled[0].status === 'fulfilled' ? tag(settled[0].value, 'authors') : [];
    authors = authors.filter(a => authorNameMatchesQuery(a.display_name, query));
    let institutions = settled[1].status === 'fulfilled' ? tag(settled[1].value, 'institutions') : [];
    let keywords = settled[2].status === 'fulfilled' ? tag(settled[2].value, 'keywords') : [];
    let works = includeWorks && settled[3].status === 'fulfilled' ? tag(settled[3].value, 'works') : [];

    suggestions.value = topByWorksCount([...authors, ...institutions, ...keywords, ...works], 5);
  } else if (!config?.hasAutocomplete) {
    // No autocomplete for this entity type
    suggestions.value = [];
    dropdownOpen.value = false;
    return;
  } else if (config?.isNative) {
    // Native entities (authors, institutions, sources, publishers, funders, etc.)
    const results = await searchEntities(currentEntity, query);
    if (id !== fetchId) return;
    let items = tag(results, currentEntity);
    if (currentEntity === 'authors') {
      items = items.filter(a => authorNameMatchesQuery(a.display_name, query));
    }
    suggestions.value = topByWorksCount(items, 5);
  } else {
    // Non-native entities with autocomplete (keywords, topics, subfields, etc.)
    const results = await api.getAutocomplete(currentEntity, { q: query });
    if (id !== fetchId) return;
    suggestions.value = tag(results || [], currentEntity).slice(0, 5);
  }

  // If the query was an ISSN and it resolved to a journal, surface that journal
  // as the top suggestion (selecting it routes to the source page).
  if (issnSourcePromise) {
    const src = await issnSourcePromise;
    if (id !== fetchId) return;
    if (src) {
      const item = { ...src, _acType: 'sources', _icon: entityIcon('sources') };
      suggestions.value = [item, ...suggestions.value.filter(s => s.id !== item.id)].slice(0, 5);
    }
  }

  highlightedIndex.value = -1;
  dropdownOpen.value = suggestions.value.length > 0;
}

const debouncedFetch = debounce(fetchSuggestions, 200);

watch(searchString, (val) => {
  if (!isUserTyping.value) return;
  if (val) {
    debouncedFetch(val);
  } else {
    debouncedFetch.cancel();
    suggestions.value = [];
    dropdownOpen.value = false;
  }
});

function dismissDropdown() {
  dropdownOpen.value = false;
  highlightedIndex.value = -1;
}

function selectSuggestion(item) {
  isUserTyping.value = false;
  dismissDropdown();
  searchString.value = '';

  const entityId = item.id?.replace('https://openalex.org/', '') || item.id;
  router.push({ name: 'EntityPage', params: { entityType: item._acType, entityId } });
}

function onEnter() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
    selectSuggestion(suggestions.value[highlightedIndex.value]);
  } else {
    dismissDropdown();
    submitSearch();
  }
}

function onArrowDown() {
  if (!showDropdown.value) return;
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1);
}

function onArrowUp() {
  if (!showDropdown.value) return;
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
}

function onEscape() {
  if (showDropdown.value) {
    dismissDropdown();
  }
}

function onTextareaInput() {
  isUserTyping.value = true;
  resizeTextarea();
}

// A paste updates the v-model value but, unlike a keystroke, does not run our
// @input handler — so isUserTyping never flips and the suggestion watcher bails
// (zd#8095: pasting an ISSN/term fired no lookup until you pressed a key). Flag
// it as user input and kick the fetch once the pasted text has landed.
function onTextareaPaste() {
  isUserTyping.value = true;
  nextTick(async () => {
    resizeTextarea();
    // Pasted OQL routes straight to the OQL tab (#598) — don't autocomplete it.
    if (await tryOqlRoute()) return;
    if (searchString.value) debouncedFetch(searchString.value);
  });
}

function resizeTextarea() {
  nextTick(() => {
    const el = inputRef.value;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

function onFocus() {
  isFocused.value = true;
  if (suggestions.value.length > 0 && searchString.value) {
    dropdownOpen.value = true;
  }
}

function onBlur() {
  isFocused.value = false;
  dismissDropdown();
}

onBeforeUnmount(() => {
  debouncedFetch.cancel();
});

// Populate from URL on mount and route changes
function syncFromRoute() {
  isUserTyping.value = false;
  const searchFromRoute = url.getSearchFromRoute(route);
  if (searchFromRoute) {
    searchString.value = searchFromRoute.value;
    const type = searchFromRoute.type;

    if (type === 'search.semantic') {
      searchMode.value = 'semantic';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = false;
    } else if (type === 'search.title.exact') {
      searchMode.value = 'term';
      searchField.value = 'title';
      stemmingDisabled.value = true;
    } else if (type === 'search.title') {
      searchMode.value = 'term';
      searchField.value = 'title';
      stemmingDisabled.value = false;
    } else if (type === 'search.title_and_abstract.exact') {
      searchMode.value = 'term';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = true;
    } else if (type === 'search.title_and_abstract') {
      searchMode.value = 'term';
      searchField.value = 'title_and_abstract';
      stemmingDisabled.value = false;
    } else if (type === 'search.exact') {
      searchMode.value = 'term';
      searchField.value = 'all';
      stemmingDisabled.value = true;
    } else {
      // 'search' (default)
      searchMode.value = 'term';
      searchField.value = 'all';
      stemmingDisabled.value = false;
    }
  } else {
    searchString.value = '';
  }
}

onMounted(() => {
  syncFromRoute();
  resizeTextarea();
});
watch(() => route.fullPath, () => {
  dismissDropdown();
  syncFromRoute();
  resizeTextarea();
});

async function submitSearch(forceEntityType) {
  if (!searchString.value && !props.showExamples) return;

  const targetEntityType = forceEntityType || entityType.value;

  if (!searchString.value) {
    url.pushToRoute(router, { name: 'Serp', params: { entityType: targetEntityType } });
    return;
  }

  // Intercept DOI/ORCID before regular search
  const handled = await tryIdentifierLookup();
  if (handled) return;

  // Typed-not-pasted OQL submitted with Enter/magnifier also routes (#598).
  if (await tryOqlRoute()) return;

  // For semantic search, do a single route push that also cleans incompatible filters/group_by
  if (searchMode.value === 'semantic') {
    const semanticAllowedKeys = new Set(
      facetConfigs('works')
        .filter(c => c.semanticSearchAllowed && c.entityToFilter === 'works')
        .map(c => c.key)
    );
    const currentQuery = { ...route.query };
    // Remove all search params
    ['search', 'search.exact', 'search.semantic', 'search.title', 'search.title.exact',
     'search.title_and_abstract', 'search.title_and_abstract.exact'].forEach(k => delete currentQuery[k]);
    currentQuery['search.semantic'] = searchString.value;
    currentQuery.page = 1;
    currentQuery.sort = 'relevance_score:desc';
    delete currentQuery.group_by;
    // Strip incompatible filters
    if (currentQuery.filter) {
      const currentFilters = filtersFromUrlStr('works', currentQuery.filter);
      const compatible = currentFilters.filter(f => semanticAllowedKeys.has(f.key));
      currentQuery.filter = filtersAsUrlStr(compatible) || undefined;
    }
    url.pushToRoute(router, {
      name: 'Serp',
      params: { entityType: targetEntityType },
      query: currentQuery,
    });
    return;
  }

  url.setNewSearch(targetEntityType, resolvedSearchType.value, searchString.value);
}

function clearSearch() {
  searchString.value = '';
  url.clearNewSearch();
  inputRef.value?.focus();
}

// The single-row magnifier button (#440 r5): plain submit, ignoring any
// autocomplete highlight (clicking the button means "search what I typed").
function clickSubmit() {
  dismissDropdown();
  submitSearch();
}

// Vuetify's v-menu moves focus (to its activator, then <body>) while it
// closes, which clobbers a single focus() call. Retry over a short window
// until focus actually sticks on the input.
function focusSearchInput() {
  const el = inputRef.value;
  if (!el) return;
  const deadline = Date.now() + 500;
  const tryFocus = () => {
    if (document.activeElement === el) return;
    el.focus();
    if (document.activeElement !== el && Date.now() < deadline) {
      setTimeout(tryFocus, 50);
    }
  };
  nextTick(tryFocus);
}
</script>

<style lang="scss" scoped>
.search-box {
  position: relative;
  border: 1px solid #E0E0E0;
  border-radius: 16px;
  background: white;
  transition: border-color 0.15s ease;

  &--focused {
    border-color: #000;
  }

  /* Embedded as a host card's body: no border/radius/background of its own, and no
     focus border (the host card owns the chrome). */
  &--borderless {
    border-color: transparent !important;
    border-radius: 0;
    background: transparent;
  }
}

.search-row-1 {
  min-height: 52px;
}

/* Single row (#440 r5): ~20% shorter than the original 52px so it reads as a
   text field, with the magnifier submit at the right edge. */
.search-row-single {
  min-height: 42px;
  padding: 2px 4px 2px 6px;
  gap: 2px;
}
.search-box--single .search-input {
  padding: 8px 10px;
}
/* Entity selector chip matches the filter chips' height (32px, v-chip
   size=default) — it rendered shorter than the chips below it (#440 r5). */
.search-row-single :deep(.entity-chip) {
  height: 32px;
  font-size: 0.875rem;
  padding: 0 12px;
}
.xpac-pill {
  flex: 0 0 auto;
}

.search-divider {
  height: 1px;
  background-color: #F0F0F0;
  margin: 0 16px;
}

.search-row-2 {
  min-height: 40px;
  padding: 4px 8px;
}

.search-input {
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  padding: 14px 18px;
  background: transparent;
  font-family: Inter, sans-serif;
  min-width: 0;
  resize: none;
  max-height: 480px; /* ~20 lines */
  overflow-y: auto;

  &::placeholder {
    color: #9CA3AF;
  }
}

.control-btn {
  color: #6B7280 !important;

  &:hover {
    color: #374151 !important;
  }
}

.control-label {
  font-size: 13px;
  font-weight: 500;
}

.control-btn--disabled {
  opacity: 0.5 !important;
  cursor: default !important;
}

.menu-subtitle {
  font-size: 12px !important;
  color: #4B5563 !important;
}

/* #598 r1: the narrowed kebab list — subtitles may wrap to two lines (Vuetify
   clamps list subtitles to one line by default), and the row toggles are inert
   (the whole row is the click target, so a tap on the switch can't double-fire). */
.search-kebab-list :deep(.v-list-item-subtitle) {
  -webkit-line-clamp: 2;
  white-space: normal;
}
.search-kebab-list :deep(.v-list-item-title) {
  white-space: normal; /* titles too — "Include expanded index (xpac)" must not truncate */
}
.search-kebab-list :deep(.kebab-switch) {
  pointer-events: none;
  flex: 0 0 auto;
}
.search-kebab-list :deep(.kebab-switch .v-selection-control) {
  min-height: 0;
}

.check-icon {
  color: #1a1a1a !important;
  font-weight: 900;
}

.autocomplete-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 4px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
}

.autocomplete-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px 0;
}

.autocomplete-item {
  padding: 8px 18px;
  cursor: pointer;
  transition: background-color 0.1s ease;

  &--highlighted {
    background-color: #F3F4F6;
  }
}

.autocomplete-item-icon {
  color: #9CA3AF;
  flex-shrink: 0;
  margin-right: 10px;
}

.autocomplete-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.4;
}

</style>
