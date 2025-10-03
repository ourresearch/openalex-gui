<template>
  <div>
    <div
      class="text-h6 text-lg-h5 mb-1"
      v-html="filters.prettyTitle(entityData.display_name)"
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

defineOptions({ name: 'EntityHeader' });

const props = defineProps({
  entityData: Object,
  showPermalinkButton: Boolean
});

const store = useStore();

const id = computed(() => props.entityData?.id);
const shortId = computed(() => shortenOpenAlexId(id.value));
const myEntityType = computed(() => entityTypeFromId(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

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
  const baseUrl = 'https://api.openalex.org/' + shortId.value;
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