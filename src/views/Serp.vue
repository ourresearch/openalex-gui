<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container fluid class="pt-0">
      <serp-toolbar :results-object="resultsObject" />
      <filter-list :results-object="resultsObject" class="mb-6 mt-6" />
      <serp-api-editor v-if="url.isViewSet(route, 'api')" class="mb-6" />

      <v-row v-if="!isMobile">
        <v-col cols="6" xl="4" v-if="url.isViewSet(route, 'list')">
          <serp-results-list :results-object="resultsObject" />
        </v-col>
        <v-col class="flex-grow-1" v-if="url.isViewSet(route, 'report')">
          <analytic-views :results-object="resultsObject" />
        </v-col>
      </v-row>

      <template v-else>
        <v-row class="mb-12">
          <v-col>
            <!-- Tabs -->
            <v-tabs v-model="resultsTab" background-color="transparent" grow>
              <v-tab key="0">Results</v-tab>
              <v-tab key="1">Stats</v-tab>
            </v-tabs>
            
            <v-card rounded flat>
              <!-- Tab Contents using v-window and v-window-item -->
              <v-window v-model="resultsTab">
                <v-window-item value="0">
                  <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject" />
                </v-window-item>
                <v-window-item value="1">
                  <analytic-views :results-object="resultsObject" />
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-container>

    <entity-drawer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';

import SerpToolbar from "@/components/SerpToolbar/SerpToolbar.vue";
import FilterList from "@/components/FilterList.vue";
import SerpApiEditor from "@/components/SerpApiEditor.vue";
import SerpResultsList from "@/components/SerpResultsList.vue";
import AnalyticViews from "@/components/AnalyticViews.vue";
import EntityDrawer from "@/components/Entity/EntityDrawer.vue";

import { url } from "@/url";
import { api } from "@/api";
import { filtersFromUrlStr } from "@/filterConfigs";
import { entityConfigs } from "../entityConfigs";
import { facetConfigs } from "../facetConfigs";

// Reactive references
const loading = ref(false);
const facetZoom = ref(null);
const filterDrawerIsOpen = ref(true);
const apiResp = ref({});
const resultsPerPage = ref(25);
const isCreateWidgetDialogOpen = ref(false);
const dialogs = ref({ export: false, createAlert: false });
const resultsTab = ref(0);
const exportEmail = ref("");
const exportIsLoading = ref(false);
const exportIsInProgress = ref(false);
const resultsObject = ref(null);
const apiMode = ref(false);
const lastGroupByValue = ref(null);
const groupByKeys = ref([]);
const groupBySearchString = ref("");
const savedActions = ref([]);
const resultsFilters = ref([]);
const listResultsCount = ref(null);
const selectedActionTab = ref("filter");
const searchString = ref("");

// Vuetify's `useDisplay` for responsive design
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

// Routing and state
const route = useRoute();
const router = useRouter();
const store = useStore();

// Computed properties
const entityType = computed(() => route.params.entityType);
const selectedEntityTypeConfig = computed(() => entityConfigs[entityType.value]);
const resultsCount = computed(() => resultsObject.value?.meta?.count);
const filtersLength = computed(() => route.query.filter?.length ?? 0);

// Popular filters based on entity type
const popularFilterOptions = computed(() => {
  return facetConfigs(entityType.value).filter(conf => conf.actionsPopular?.includes("filter"));
});

// // Number of pages for pagination
const numPages = computed(() => {
  const maxToShow = isMobile.value ? 4 : 10;
  return Math.min(
    Math.ceil(resultsObject.value.meta.count / resultsPerPage.value),
    maxToShow
  );
});

// Reactive handling of URL query states
const isAnalyze = computed({
  get: () => !!route.query.analyze,
  set: (to: boolean) => {
    const analyze = to ? to : undefined;
    url.pushToRoute(router, {
      name: "Serp",
      query: { ...route.query, analyze },
    });
  }
});

const isShowApiSet = computed({
  get: () => !!route.query.show_api,
  set: (to: boolean) => {
    const show_api = to ? to : undefined;
    url.pushToRoute(router, {
      name: "Serp",
      query: { ...route.query, show_api },
    });
  }
});

// Methods
function copyToClipboard(content: string) {
  navigator.clipboard.writeText(content);
  store.commit("snackbar", "URL copied to clipboard.");
}

function clearGroupBy() {
  url.pushToRoute(router, {
    name: "Serp",
    query: {
      ...route.query,
      group_by: undefined,
    }
  });
}

// Watchers
watch(() => route.params.entityType, (newType) => {
  store.commit("setEntityType", newType);
});

// Mounted lifecycle hook
onMounted(async () => {
  if (route.query.id && !store.getters.userSavedSearches.find(s => s.id === route.query.id)) {
    const query = { ...route.query, id: undefined };
    url.pushToRoute(router, { name: "Serp", query });
  }

  if (store.getters.userId) {
    store.commit("user/setActiveSearchId", route.query.id);
  }

  const apiQuery = url.makeApiUrl(route);
  store.state.isLoading = true;
  const resp = await api.getResultsList(apiQuery);
  store.state.isLoading = false;
  resultsObject.value = resp;

  store.state.resultsObject = resp;
  resultsFilters.value = filtersFromUrlStr(entityType.value, route.query.filter);
});
</script>

<style lang="scss">
.container {
  //max-width: 1024px !important;
}

.v-pagination__item,
.v-pagination__navigation {
  box-shadow: none;
}

.serp-page {
  //background: #F3F7FF;
}

table.serp-results-table {
  border-collapse: collapse;

  tr {
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, .05);
    }
  }

  td {
    border: none;
    margin: 0;
    padding: 5px 10px;

    &.range {
      text-align: right;
      //font-family: Monaco, Menlo, Consolas, Bitstream Vera Sans Mono, monospace;
    }

    &.boolean {
      text-align: center;
    }
  }
}
</style>
