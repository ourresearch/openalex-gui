<template>
  <div>
    <div
      class="text-h6 text-lg-h5 mb-1"
      v-html="filters.prettyTitle(displayTitle)"
    />
    <div class="d-flex align-center">
      <link-entity-roles-list
        v-if="entityData.roles"
        :roles="entityData.roles"
        :selected="myEntityConfig.nameSingular"
        style="margin-left:-13px;"
      />
      <div class="mr-3" v-else>
        <v-icon size="x-small" variant="plain">{{ myEntityConfig.icon }}</v-icon>
        {{ filters.capitalize(myEntityConfig.displayNameSingular) }}
      </div>
    </div>

    <v-toolbar flat dense class="mt-4" style="margin-left: -20px;" color="transparent">
      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <location-linkouts v-else-if="myEntityType === 'locations'" :data="entityData"/>
      <v-btn v-else color="primary" rounded variant="flat" :to="filters.entityWorksLink(entityData.id)">
        View works
      </v-btn>

      <v-tooltip location="bottom" v-if="entityData.homepage_url">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="entityData.homepage_url" target="_blank">
            <v-icon>mdi-home-outline</v-icon>
          </v-btn>
        </template>
        Visit homepage
      </v-tooltip>

      <v-tooltip location="bottom">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="apiUrl" target="_blank">
            <v-icon>mdi-api</v-icon>
          </v-btn>
        </template>
        View in API
      </v-tooltip>

      <v-tooltip location="bottom" v-if="showPermalinkButton">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :to="permalinkUrl">
            <v-icon>mdi-link</v-icon>
          </v-btn>
        </template>
        View permalink page
      </v-tooltip>

      <v-tooltip location="bottom">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" variant="plain" icon :href="feebackUrl"
                 target="_blank">
            <v-icon>mdi-message-alert-outline</v-icon>
          </v-btn>
        </template>
        Send feedback
      </v-tooltip>
    </v-toolbar>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';
import { getEntityConfig } from '@/entityConfigs';
import { entityTypeFromId, shortenOpenAlexId } from '@/util';

import LinkEntityRolesList from '@/components/LinkEntityRolesList.vue';
import WorkLinkouts from '@/components/WorkLinkouts.vue';
import LocationLinkouts from '@/components/LocationLinkouts.vue';

defineOptions({ name: 'EntityHeader' });

const props = defineProps({
  entityData: Object,
  showPermalinkButton: Boolean,
  entityType: String
});

const store = useStore();

const id = computed(() => props.entityData?.id);
const shortId = computed(() => shortenOpenAlexId(id.value));
const myEntityType = computed(() => props.entityType || entityTypeFromId(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

// For locations, use the title field as the display name and append source name
const displayTitle = computed(() => {
  if (myEntityType.value === 'locations') {
    const title = props.entityData?.title || props.entityData?.id || 'Location';
    const sourceName = props.entityData?.source_name || props.entityData?.source?.display_name;
    return sourceName ? `${title} [${sourceName}]` : title;
  }
  return props.entityData?.display_name;
});

// Compute the permalink with data-version parameter if needed
const permalinkUrl = computed(() => {
  const baseUrl = '/' + shortId.value;
  // Check if v2 mode is enabled in the store
  if (store.state.useV2) {
    return baseUrl + '?data-version=2';
  }
  return baseUrl;
});

// Compute the API URL with data-version parameter if needed
const apiUrl = computed(() => {
  // For locations, use the full entity ID path
  let path = shortId.value;
  if (myEntityType.value === 'locations') {
    path = 'locations/' + props.entityData?.id;
  }
  const baseUrl = 'https://api.openalex.org/' + path;
  // Check if v2 mode is enabled in the store
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