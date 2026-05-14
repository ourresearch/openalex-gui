<template>
  <div>
    <div class="d-flex align-center">
      <div
        :class="titleClass"
        v-html="filters.prettyTitle(displayTitle)"
      />
      <slot name="after-title" />
      <v-spacer />
      <v-tooltip location="bottom" aria-label="View in API">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="apiUrl" target="_blank" aria-label="View in API">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>

      <v-tooltip location="bottom" aria-label="Send feedback">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="feebackUrl"
                 target="_blank" aria-label="Send feedback">
            <v-icon>mdi-message-alert-outline</v-icon>
          </v-btn>
        </template>
        Send feedback
      </v-tooltip>
    </div>
    <slot name="after-header" />

    <div class="d-flex align-center flex-wrap">
      <link-entity-roles-list
        v-if="entityData.roles"
        :roles="entityData.roles"
        :selected="myEntityConfig.nameSingular"
      />
      <div class="mr-3" v-else>
        <v-icon size="x-small" variant="plain">{{ myEntityConfig.icon }}</v-icon>
        {{ filters.capitalize(myEntityConfig.displayNameSingular) }}
      </div>

      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <location-linkouts v-else-if="myEntityType === 'locations'" :data="entityData"/>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';
import { getEntityConfig } from '@/entityConfigs';
import * as openalexId from '@/openalexId';

import LinkEntityRolesList from '@/components/LinkEntityRolesList.vue';
import WorkLinkouts from '@/components/WorkLinkouts.vue';
import LocationLinkouts from '@/components/LocationLinkouts.vue';

defineOptions({ name: 'EntityHeader' });

const props = defineProps({
  entityData: Object,
  entityType: String
});

const store = useStore();

const id = computed(() => props.entityData?.id);
const shortId = computed(() => openalexId.getShortId(id.value));
const normalizedId = computed(() => openalexId.normalizeId(id.value));
const isNative = computed(() => openalexId.isNativeEntityType(myEntityType.value));
const myEntityType = computed(() => props.entityType || openalexId.getEntityType(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

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

const feebackUrl = computed(() => {
  const descriptionText = `<br /><br /><br />----------------<br />For internal use:<br />This is a support request originating from OpenAlex Web about entity: ${props.entityData?.id}`;
  return 'https://openalex.zendesk.com/hc/en-us/requests/new?tf_description=' + descriptionText;
});
</script>



<style scoped lang="scss">

</style>