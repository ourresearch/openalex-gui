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
         + the current user's labels chip strip. Everything sits on one row;
         the back button is hidden when the user landed here from outside the
         app, so first-impression users don't see a useless "back" affordance. -->
    <div class="d-flex align-center flex-wrap header-meta-row mb-2">
      <v-btn
        v-if="showBackButton && cameFromSerp"
        color="primary"
        size="small"
        density="compact"
        variant="text"
        class="back-btn mr-2"
        @click="onBackClick"
      >
        <v-icon size="small" start>mdi-arrow-left</v-icon>
        back
      </v-btn>

      <link-entity-roles-list
        v-if="entityData.roles"
        :roles="entityData.roles"
        :selected="myEntityConfig.nameSingular"
      />
      <div v-else class="entity-type-indicator">
        <v-icon size="x-small" variant="plain">{{ myEntityConfig.icon }}</v-icon>
        {{ filters.capitalize(myEntityConfig.displayNameSingular) }}
      </div>

      <entity-labels-row
        v-if="entityData?.id"
        :entity-type="myEntityType"
        :entity-id="entityData.id"
        compact
        class="ml-3"
      />
    </div>

    <!-- Row 1: title. [api] sits here for non-works (no linkouts row exists for them);
         for works it moves to the linkouts row below. The legacy [!] feedback button
         was removed — users have in-app feedback channels and it added clutter. -->
    <div class="d-flex align-start">
      <div
        :class="titleClass"
        v-html="filters.prettyTitle(displayTitle)"
      />
      <slot name="after-title" />
      <v-spacer />
      <entity-header-claim-profile-button
        v-if="myEntityType === 'authors' && entityData?.id"
        :author-id="shortId"
        class="mr-2"
      />
      <v-tooltip v-if="myEntityType !== 'works'" location="bottom" aria-label="View in API">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="apiUrl" target="_blank" aria-label="View in API">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>
      <slot name="header-actions" />
    </div>
    <slot name="after-header" />

    <!-- Row 2 (works/locations only): linkouts, with [api] appended for works. -->
    <div
      v-if="myEntityType === 'works' || myEntityType === 'locations'"
      class="d-flex align-center flex-wrap mt-3"
    >
      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <location-linkouts v-else :data="entityData"/>
      <v-tooltip v-if="myEntityType === 'works'" location="bottom" aria-label="View in API">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="apiUrl" target="_blank" aria-label="View in API">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>
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
import EntityLabelsRow from '@/components/Label/EntityLabelsRow.vue';

defineOptions({ name: 'EntityHeader' });

const props = defineProps({
  entityData: Object,
  entityType: String,
  // Render the back button in the header-meta row when the user came from a
  // SERP-like page. Set false in surfaces that already have their own close
  // affordance (e.g. EntityDrawer).
  showBackButton: { type: Boolean, default: true },
});

const store = useStore();
const router = useRouter();

const id = computed(() => props.entityData?.id);
const shortId = computed(() => openalexId.getShortId(id.value));
const normalizedId = computed(() => openalexId.normalizeId(id.value));
const isNative = computed(() => openalexId.isNativeEntityType(myEntityType.value));
const myEntityType = computed(() => props.entityType || openalexId.getEntityType(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

// Read once on mount — history.state.back reflects the previous in-app
// navigation, and stays stable while we're on this page. Direct hits (typing
// a URL, opening from an external link) have no `.back`, so the button stays
// hidden.
const cameFromSerp = ref(false);
const SERP_PATH_RE = /^\/(works|authors|sources|institutions|topics|sdgs|funders|publishers|keywords|concepts|labels)(\/|\?|$)/;
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
  // Subtle visual weight for the meta strip: type indicator + label chips
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
