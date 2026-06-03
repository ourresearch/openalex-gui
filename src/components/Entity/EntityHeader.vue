<template>
  <div>
    <!-- Retraction banner — sits ABOVE the title so the user can't miss it
         before forming an impression of the work. Only shown when the
         publisher's retraction flag is set on a work. OpenAlex doesn't carry
         retraction date/reason yet (the field is a bare boolean), so the
         banner just states the fact. -->
    <v-alert
      v-if="myEntityType === 'works' && entityData?.is_retracted"
      type="error"
      variant="tonal"
      density="compact"
      icon="mdi-alert-octagon"
      class="mb-3"
    >
      This work has been retracted.
    </v-alert>

    <!-- Row 0: back button (if user came from SERP) + entity-type indicator
         + the current user's collections chip strip on the left; page-level icon
         actions (API link, claim badge/button) on the far right. The right
         side is the home for small whole-page affordances — they sit out of
         the way of the title and stay consistent across entity types. -->
    <div class="d-flex align-center flex-wrap header-meta-row mb-2">
      <v-btn
        v-if="showBackButton && cameFromSerp"
        color="primary"
        size="small"
        density="compact"
        variant="text"
        icon
        aria-label="Back"
        class="back-btn mr-2"
        @click="onBackClick"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <!-- Collections reuse this header (isCollection) to match the entity-page
           look, but a collection isn't an OpenAlex entity: the type indicator
           becomes a folder + "Collection", and the entity-only affordances
           below (claim, collection chips, API link, collection menu) are
           suppressed. -->
      <div v-if="isCollection" class="entity-type-indicator">
        <v-icon size="x-small" variant="plain">mdi-folder-outline</v-icon>
        Collection
      </div>
      <link-entity-roles-list
        v-else-if="entityData.roles"
        :roles="entityData.roles"
        :selected="myEntityConfig.nameSingular"
      />
      <div v-else class="entity-type-indicator">
        <v-icon size="x-small" variant="plain">{{ myEntityConfig.icon }}</v-icon>
        {{ filters.capitalize(myEntityConfig.displayNameSingular) }}
      </div>

      <v-spacer />

      <entity-header-claim-profile-button
        v-if="!isCollection && myEntityType === 'authors' && entityData?.id"
        :author-id="shortId"
        class="mr-1"
      />
      <entity-collections-row
        v-if="!isCollection && entityData?.id"
        :entity-type="myEntityType"
        :entity-id="entityData.id"
        compact
        class="mr-2"
      />
      <v-tooltip v-if="!isCollection" location="bottom" aria-label="View in API">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="apiUrl" target="_blank" aria-label="View in API">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>
      <entity-header-collection-menu
        v-if="!isCollection && entityData?.id && isNativeCollectionType"
        :entity-type="myEntityType"
        :entity-id="entityData.id"
      />
      <slot name="header-actions" />
    </div>

    <!-- Row 1: title. -->
    <div class="d-flex align-start">
      <div
        :class="titleClass"
        v-html="filters.prettyTitle(displayTitle)"
      />
      <slot name="after-title" />
      <v-spacer />
    </div>
    <slot name="after-header" />

    <!-- Row 2 (works/locations only): linkouts. -->
    <div
      v-if="myEntityType === 'works' || myEntityType === 'locations'"
      class="d-flex align-center flex-wrap mt-3"
    >
      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <location-linkouts v-else :data="entityData"/>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import filters from '@/filters';
import { getEntityConfig } from '@/entityConfigs';
import * as openalexId from '@/openalexId';

import LinkEntityRolesList from '@/components/LinkEntityRolesList.vue';
import WorkLinkouts from '@/components/WorkLinkouts.vue';
import LocationLinkouts from '@/components/LocationLinkouts.vue';
import EntityHeaderClaimProfileButton from '@/components/Entity/EntityHeaderClaimProfileButton.vue';
import EntityCollectionsRow from '@/components/Collection/EntityCollectionsRow.vue';
import EntityHeaderCollectionMenu from '@/components/Collection/EntityHeaderCollectionMenu.vue';

defineOptions({ name: 'EntityHeader' });

const props = defineProps({
  entityData: Object,
  entityType: String,
  // Render the back button in the header-meta row when the user came from a
  // SERP-like page. Set false in surfaces that already have their own close
  // affordance (e.g. EntityDrawer).
  showBackButton: { type: Boolean, default: true },
  // Collection mode: the header represents a user collection, not an OpenAlex
  // entity. Swaps the type indicator for a folder + "Collection" and hides the
  // entity-only affordances (claim, collection chips, API link, collection
  // menu). entityData is the collection object (display_name, id `col_…`).
  isCollection: { type: Boolean, default: false },
});

const store = useStore();
const router = useRouter();

const id = computed(() => props.entityData?.id);
const shortId = computed(() => openalexId.getShortId(id.value));
const normalizedId = computed(() => openalexId.normalizeId(id.value));
const isNative = computed(() => openalexId.isNativeEntityType(myEntityType.value));
const myEntityType = computed(() => props.entityType || openalexId.getEntityType(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

// Collections feature: kebab + chip row are gated on the flag, on having a
// logged-in user (EntityCollectionsRow handles its own auth gate), and on the
// entity being one of the 10 v1 supported types (the same set CollectionField
// is registered on in elastic-api).
const COLLECTION_ENTITY_TYPES = new Set([
  'works', 'authors', 'sources', 'institutions', 'topics',
  'sdgs', 'funders', 'publishers', 'keywords', 'concepts',
]);
const isNativeCollectionType = computed(() => COLLECTION_ENTITY_TYPES.has(myEntityType.value));

// Read once on mount — history.state.back reflects the previous in-app
// navigation, and stays stable while we're on this page. Direct hits (typing
// a URL, opening from an external link) have no `.back`, so the button stays
// hidden.
const cameFromSerp = ref(false);
const SERP_PATH_RE = /^\/(works|authors|sources|institutions|topics|sdgs|funders|publishers|keywords|concepts|collections)(\/|\?|$)/;
onMounted(() => {
  const prev = window.history.state?.back || '';
  cameFromSerp.value = SERP_PATH_RE.test(prev);
});

function onBackClick() {
  router.back();
}

const titleClass = computed(() => {
  const base = 'font-weight-bold mb-2';
  return myEntityType.value === 'works'
    ? `text-h5 text-lg-h4 ${base}`
    : `text-h4 text-lg-h3 ${base}`;
});

// For locations, use the title field as the display name and append source name
// For awards, use funder_award_id fallback if no display_name
const displayTitle = computed(() => {
  if (myEntityType.value === 'locations') {
    const title = props.entityData?.title || props.entityData?.id || 'Location';
    const sourceName = props.entityData?.source_name || props.entityData?.source?.display_name;
    return sourceName ? `${title} [${sourceName}]` : title;
  }
  if (myEntityType.value === 'awards') {
    return filters.getAwardDisplayTitle(props.entityData);
  }
  return props.entityData?.display_name;
});

// Compute the API URL with data-version parameter if needed
const apiUrl = computed(() => {
  // For locations, use the full entity ID path
  let path;
  if (myEntityType.value === 'locations') {
    path = 'locations/' + props.entityData?.id;
  } else if (isNative.value) {
    path = shortId.value;
  } else {
    path = normalizedId.value;
  }
  const baseUrl = 'https://api.openalex.org/' + path;
  if (store.state.useV2) {
    return baseUrl + '?data-version=2';
  }
  return baseUrl;
});

</script>



<style scoped lang="scss">
.header-meta-row {
  // Subtle visual weight for the meta strip: type indicator + collection chips
  // shouldn't outshout the title beneath.
  color: rgba(0, 0, 0, 0.72);
  font-size: 0.95rem;
}
.entity-type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.back-btn {
  // Tighten so the back chevron hugs the left edge of the meta row.
  margin-left: -8px;
}
</style>
