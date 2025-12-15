<template>
  <div>
    <div
      class="text-lg md:text-xl font-semibold mb-1"
      v-html="filters.prettyTitle(displayTitle)"
    />
    <div class="flex items-center">
      <link-entity-roles-list
        v-if="entityData.roles"
        :roles="entityData.roles"
        :selected="myEntityConfig.nameSingular"
        style="margin-left:-13px;"
      />
      <div class="mr-3 flex items-center gap-1 text-sm text-muted-foreground" v-else>
        <component :is="getEntityIcon(myEntityConfig.icon)" class="h-4 w-4" />
        {{ filters.capitalize(myEntityConfig.displayNameSingular) }}
      </div>
    </div>

    <div class="flex items-center gap-1 mt-4 -ml-2">
      <work-linkouts v-if="myEntityType === 'works'" :data="entityData"/>
      <location-linkouts v-else-if="myEntityType === 'locations'" :data="entityData"/>
      <Button
        v-else
        :as="worksCount > 0 ? 'router-link' : 'button'"
        :to="worksCount > 0 ? filters.entityWorksLink(entityData.id) : undefined"
        :disabled="worksCount === 0"
      >
        {{ worksCount === 0 ? (myEntityType === 'awards' ? 'No outputs' : 'No works') : (myEntityType === 'awards' ? 'View outputs' : 'View works') }}
      </Button>

      <Button
        v-if="myEntityType === 'funders'"
        variant="outline"
        as="router-link"
        :to="filters.funderAwardsLink(entityData.id)"
      >
        View awards
      </Button>

      <Tooltip v-if="homepageUrl">
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon" as="a" :href="homepageUrl" target="_blank">
            <Home class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ myEntityType === 'awards' ? 'Visit landing page' : 'Visit homepage' }}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon" as="a" :href="apiUrl" target="_blank">
            <Code class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View in API</TooltipContent>
      </Tooltip>

      <Tooltip v-if="showPermalinkButton">
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon" as="router-link" :to="permalinkUrl">
            <Link class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View permalink page</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon" as="a" :href="feebackUrl" target="_blank">
            <MessageSquareWarning class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send feedback</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { 
  Home, Code, Link, MessageSquareWarning, FileText, Users, 
  BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign 
} from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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

const iconMap = {
  'mdi-file-document-outline': FileText,
  'mdi-account-outline': Users,
  'mdi-book-open-page-variant-outline': BookOpen,
  'mdi-domain': Building2,
  'mdi-town-hall': Landmark,
  'mdi-lightbulb-outline': Lightbulb,
  'mdi-map-marker-outline': MapPin,
  'mdi-trophy-outline': Award,
  'mdi-cash-multiple': DollarSign,
};

function getEntityIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

const id = computed(() => props.entityData?.id);
const shortId = computed(() => shortenOpenAlexId(id.value));
const myEntityType = computed(() => props.entityType || entityTypeFromId(id.value));
const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

// Homepage URL - use landing_page_url for awards, homepage_url for others
const homepageUrl = computed(() => {
  if (myEntityType.value === 'awards') {
    return props.entityData?.landing_page_url;
  }
  return props.entityData?.homepage_url;
});

// Works count - use funded_outputs_count for awards, works_count for others
const worksCount = computed(() => {
  if (myEntityType.value === 'awards') {
    return props.entityData?.funded_outputs_count;
  }
  return props.entityData?.works_count;
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



<style scoped>
/* Minimal scoped styles */
</style>