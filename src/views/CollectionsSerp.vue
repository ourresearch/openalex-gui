<!--
  /collections: the collections search page (oxjob #1532), a sibling of the entity
  search pages. It lists what GET api.openalex.org/collections lists: public
  collections (made by OpenAlex) for everyone, plus your own when you're logged in.
  Every row says, prominently, whether it is Public, Private or Shared by link
  (Jason, 2026-10-03).

  Its own page rather than the generic SERP: collections live in users-api, not
  Elasticsearch, so the SERP's OQL, group-by and export machinery doesn't apply.
  The URL carries the same words as the API: ?search=, ?filter=entity_type:x,access:y,
  ?sort=, ?page=.
-->
<template>
  <v-container class="collections-serp py-6" style="max-width: 960px">
    <h1 class="text-h5 font-weight-bold">Collections</h1>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-4">
      Public collections are lists made by OpenAlex, like country groups. Use one in any
      filter, or make a copy to edit your own.
      <template v-if="isLoggedIn">Your own collections show here too.</template>
    </p>

    <v-text-field
      v-model="searchInput"
      placeholder="Search collections by name or description"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="comfortable"
      rounded
      hide-details
      clearable
      aria-label="Search collections"
      @keydown.enter="applySearch"
      @click:clear="clearSearch"
    />

    <div class="d-flex flex-wrap align-center ga-2 mt-4">
      <v-menu v-for="facet in facets" :key="facet.key">
        <template #activator="{ props: menuProps }">
          <v-chip
            v-bind="menuProps"
            :variant="filterValue(facet.key) ? 'flat' : 'outlined'"
            :color="filterValue(facet.key) ? 'primary' : undefined"
            append-icon="mdi-menu-down"
          >
            {{ facet.label }}<template v-if="filterValue(facet.key)">: {{ facetValueLabel(facet, filterValue(facet.key)) }}</template>
          </v-chip>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-item :active="!filterValue(facet.key)" @click="setFilter(facet.key, null)">
            <v-list-item-title>All</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="g in groups[facet.key]"
            :key="g.key"
            :active="filterValue(facet.key) === g.key"
            @click="setFilter(facet.key, g.key)"
          >
            <v-list-item-title>{{ facetValueLabel(facet, g.key) }}</v-list-item-title>
            <template #append>
              <span class="text-body-2 text-medium-emphasis ml-4">{{ g.count.toLocaleString() }}</span>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer />

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" variant="text" size="small" append-icon="mdi-menu-down">
            Sort: {{ sortLabel }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="s in SORTS"
            :key="s.value"
            :active="sort === s.value"
            @click="setSort(s.value)"
          >
            <v-list-item-title>{{ s.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="text-body-2 text-medium-emphasis mt-4 mb-1" aria-live="polite">
      <template v-if="loading">Loading…</template>
      <template v-else-if="!error">{{ count.toLocaleString() }} {{ count === 1 ? 'collection' : 'collections' }}</template>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="my-3">{{ error }}</v-alert>

    <div v-if="!loading && !error && !results.length" class="py-8 text-center text-medium-emphasis">
      No collections match.
      <a v-if="hasQuery" href="#" @click.prevent="clearAll">Clear search and filters</a>
    </div>

    <div class="collections-results" :class="{ 'is-loading': loading }">
      <div v-for="c in results" :key="c.id" class="result-item">
        <v-icon class="result-icon" size="20" aria-hidden="true">{{ entityIcon(c.entity_type) }}</v-icon>
        <div class="result-content">
          <div class="result-row-1">
            <router-link :to="`/collections/${c.id}`" class="result-title text-body-1 font-weight-medium">
              {{ c.display_name }}
            </router-link>
            <collection-access-tag :access="c.access" prominent />
          </div>
          <div v-if="c.description" class="result-description mt-1">{{ c.description }}</div>
          <div class="result-meta mt-1">
            Collection of {{ entityPlural(c.entity_type).toLowerCase() }}
            · {{ (c.member_count ?? 0).toLocaleString() }} {{ c.member_count === 1 ? 'member' : 'members' }}
            <template v-if="c.updated_date"> · Updated {{ formatDate(c.updated_date) }}</template>
          </div>
        </div>
      </div>
    </div>

    <v-pagination
      v-if="pageCount > 1"
      :model-value="page"
      :length="pageCount"
      :total-visible="7"
      density="comfortable"
      class="mt-4"
      @update:model-value="setPage"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useHead } from "@unhead/vue";
import axios from "axios";

import { urlBase, axiosConfig } from "@/apiConfig";
import { normalizeCollection } from "@/collectionShape";
import { accessInfo } from "@/collectionAccess";
import { collectionTypeIcon as entityIcon, collectionTypePlural as entityPlural, capitalizeFirst } from "@/collectionTypeLabels";
import CollectionAccessTag from "@/components/Collection/CollectionAccessTag.vue";

defineOptions({ name: "CollectionsSerp" });
useHead({ title: "Collections search" });

const route = useRoute();
const router = useRouter();
const store = useStore();

const PER_PAGE = 25;
const SORTS = [
  { value: "display_name", label: "Name" },
  { value: "member_count:desc", label: "Most members" },
  { value: "updated_date:desc", label: "Recently updated" },
];

const isLoggedIn = computed(() => !!store.getters["user/userId"]);

// The facets: Type for everyone; Access once you're logged in (logged out, every
// listed collection is public, so the facet would have one value).
const facets = computed(() => [
  { key: "entity_type", label: "Type" },
  ...(isLoggedIn.value ? [{ key: "access", label: "Access" }] : []),
]);

function facetValueLabel(facet, key) {
  return facet.key === "access" ? accessInfo(key).label : capitalizeFirst(entityPlural(key));
}
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---- URL state ----------------------------------------------------------------
// Only the facets on screen apply, so every filter in force has a chip to clear it
// (logged out there is no Access facet).
function parseFilters(raw, keys) {
  const out = {};
  for (const part of String(raw || "").split(",")) {
    const [k, v] = part.split(":");
    if (k && v && keys.includes(k)) out[k] = v;
  }
  return out;
}
const urlFilters = computed(() => parseFilters(route.query.filter, facets.value.map(f => f.key)));
const search = computed(() => String(route.query.search || ""));
const sort = computed(() => SORTS.some(s => s.value === route.query.sort) ? route.query.sort : "display_name");
const page = computed(() => Math.max(1, parseInt(route.query.page, 10) || 1));
const sortLabel = computed(() => SORTS.find(s => s.value === sort.value)?.label);
const hasQuery = computed(() => !!search.value || Object.keys(urlFilters.value).length > 0);

function filterValue(key) {
  return urlFilters.value[key] || null;
}
function pushQuery(changes) {
  const query = { ...route.query, ...changes };
  for (const k of Object.keys(query)) if (query[k] === null || query[k] === "") delete query[k];
  router.push({ path: "/collections", query });
}
function filterString(filtersObj) {
  return Object.entries(filtersObj).map(([k, v]) => `${k}:${v}`).join(",");
}
function setFilter(key, value) {
  const next = { ...urlFilters.value };
  if (value) next[key] = value; else delete next[key];
  pushQuery({ filter: filterString(next) || null, page: null });
}
function setSort(value) {
  pushQuery({ sort: value === "display_name" ? null : value, page: null });
}
function setPage(p) {
  pushQuery({ page: p > 1 ? String(p) : null });
  window.scrollTo({ top: 0 });
}

const searchInput = ref(search.value);
watch(search, (s) => { searchInput.value = s; });
function applySearch() {
  pushQuery({ search: (searchInput.value || "").trim() || null, page: null });
}
function clearSearch() {
  searchInput.value = "";
  pushQuery({ search: null, page: null });
}
function clearAll() {
  router.push({ path: "/collections" });
}

// ---- fetching -----------------------------------------------------------------
const results = ref([]);
const count = ref(0);
const groups = ref({ entity_type: [], access: [] });
const loading = ref(false);
const error = ref("");
const pageCount = computed(() => Math.ceil(count.value / PER_PAGE));
let seq = 0;

function listUrl(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") qs.set(k, v);
  return `${urlBase.collectionsApi}/collections?${qs.toString()}`;
}

async function load() {
  const mine = ++seq;
  const fs = facets.value;
  loading.value = true;
  error.value = "";
  const base = { search: search.value || null };
  try {
    const listReq = axios.get(listUrl({
      ...base,
      filter: filterString(urlFilters.value) || null,
      sort: sort.value,
      page: page.value,
      per_page: PER_PAGE,
    }), axiosConfig({ userAuth: true }));
    // Each facet counts under the OTHER filters, so its own choice doesn't hide its
    // alternatives.
    const groupReqs = fs.map(f => {
      const others = { ...urlFilters.value };
      delete others[f.key];
      return axios.get(listUrl({ ...base, filter: filterString(others) || null, group_by: f.key }),
        axiosConfig({ userAuth: true }));
    });
    const [listResp, ...groupResps] = await Promise.all([listReq, ...groupReqs]);
    if (mine !== seq) return;
    results.value = (listResp.data.results || []).map(normalizeCollection);
    count.value = listResp.data.meta?.count ?? 0;
    const next = { entity_type: [], access: [] };
    fs.forEach((f, i) => { next[f.key] = groupResps[i].data.group_by || []; });
    groups.value = next;
  } catch (e) {
    if (mine !== seq) return;
    results.value = [];
    count.value = 0;
    error.value = e.response?.data?.message || "Couldn't load collections. Try again.";
  } finally {
    if (mine === seq) loading.value = false;
  }
}

watch(() => [route.fullPath, isLoggedIn.value], () => {
  if (route.path === "/collections") load();
}, { immediate: true });
</script>

<style scoped>
.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.result-item:last-child {
  border-bottom: none;
}
.result-icon {
  margin-top: 2px;
  color: rgba(0, 0, 0, 0.45);
}
.result-content {
  flex: 1 1 0;
  min-width: 0;
}
.result-row-1 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.result-title {
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
  text-decoration: none;
}
.result-title:hover {
  text-decoration: underline;
}
.result-description {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.75);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.result-meta {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
}
.collections-results.is-loading {
  opacity: 0.5;
}
</style>
