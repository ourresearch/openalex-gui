<template>
  <div>
    <!-- SelectionMenu for group_by action -->
    <selection-menu
      v-if="myConfig.id === 'group_by'"
      :all-keys="allOptions"
      :popular-keys="popularOptions"
      :selected-keys="selectedOptions"
      :disabled-keys="myConfig?.disableKeys || []"
      :get-display-name="getKeyDisplayName"
      :get-icon="getKeyIcon"
      search-placeholder="Search all"
      more-dialog-title="More Report Options"
      button-style="icon"
      :is-stateful="true"
      @select="clickOption"
      @toggle="toggleOption"
    />

    <!-- Original menu for sort and other actions -->
    <DropdownMenu v-else>
      <DropdownMenuTrigger>
        <Button v-if="myConfig.id === 'filter'" variant="ghost" size="icon">
          <Plus class="h-5 w-5" />
        </Button>
        <Button
          v-else
          variant="ghost"
          size="icon"
          :disabled="disabled"
        >
          <ArrowUpDown v-if="myConfig.id === 'sort'" class="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuLabel>
          <template v-if="myConfig.id === 'sort'">Sort by:</template>
          <template v-if="myConfig.id === 'filter'">Add filter:</template>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          v-for="key in menuOptions"
          :key="key"
          :disabled="myConfig?.disableKeys?.includes(key)"
          @click="clickOption(key)"
        >
          <component :is="getIconComponent(getKeyIcon(key))" class="mr-2 h-4 w-4 text-muted-foreground" />
          {{ filters.titleCase(getKeyDisplayName(key)) }}
          <Check v-if="selectedOptions.includes(key)" class="ml-auto h-4 w-4" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem @click="openMoreDialog">
          More
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog :open="isMoreDialogOpen" @update:open="isMoreDialogOpen = $event">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>More {{ myConfig.displayName }} Options</DialogTitle>
        </DialogHeader>
        
        <ScrollArea class="max-h-[60vh]">
          <div class="space-y-1">
            <button
              v-for="key in allOptions"
              :key="key"
              :disabled="myConfig?.disableKeys?.includes(key)"
              class="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
              @click="clickOption(key)"
            >
              <component :is="getIconComponent(getKeyIcon(key))" class="mr-2 h-4 w-4" />
              {{ filters.titleCase(getKeyDisplayName(key)) }}
              <Check v-if="selectedOptions.includes(key)" class="ml-auto h-4 w-4" />
            </button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { Plus, ArrowUpDown, Check, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign, Calendar, Hash, BarChart3 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { url } from '@/url';
import filters from '@/filters';
import { facetConfigs, getFacetConfig } from '@/facetConfigs';
import { getActionConfig } from '@/actionConfigs';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';

defineOptions({ name: 'ActionMenu' });

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
  'mdi-calendar': Calendar,
  'mdi-pound': Hash,
  'mdi-chart-bar': BarChart3,
};

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

const props = defineProps({
  action: String,
  disabled: Boolean
});

const store = useStore();
const route = useRoute();
const emit = defineEmits(['click']);

const isMoreDialogOpen = ref(false);
const entityType = computed(() => store.getters['entityType']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const selectedOptions = computed(() => {
  if (props.action === 'group_by') {
    return url.getGroupBy(route);
  }
  return url.getActionValueKeys(route, props.action);
});

const allOptions = computed(() => {
  const configs = facetConfigs(entityType.value)
    .filter(conf => conf.actions?.includes(props.action))
    .filter(conf => !conf.requiresApiKey || isAdmin.value)
    .filter(conf => {
      // Hide is_xpac unless include_xpac is enabled
      if (conf.key === 'is_xpac' && route.query.include_xpac !== 'true') {
        return false;
      }
      return true;
    })
    .map(conf => conf.key);
  return configs;
});

const popularOptions = computed(() => {
  const configs = facetConfigs(entityType.value)
    .filter(conf => conf.actionsPopular?.includes(props.action))
    .filter(conf => !conf.requiresApiKey || isAdmin.value)
    .filter(conf => {
      // Hide is_xpac unless include_xpac is enabled
      if (conf.key === 'is_xpac' && route.query.include_xpac !== 'true') {
        return false;
      }
      return true;
    })
    .map(conf => conf.key);
  
  // For group_by, also include currently selected widgets
  if (props.action === 'group_by') {
    selectedOptions.value.forEach(selectedKey => {
      if (!configs.includes(selectedKey)) {
        configs.push(selectedKey);
      }
    });
  }
  
  return configs;
});

const menuOptions = computed(() => {
  return popularOptions.value;
});

const myConfig = computed(() => getActionConfig(props.action));

const getKeyDisplayName = (key) => {
  return getFacetConfig(entityType.value, key)?.displayName;
};

const getKeyIcon = (key) => {
  return getFacetConfig(entityType.value, key)?.icon;
};

const openMoreDialog = () => {
  isMoreDialogOpen.value = true;
};

const closeMoreDialog = () => {
  isMoreDialogOpen.value = false;
};

const clickOption = (key) => {
  isMoreDialogOpen.value = false;
  if (props.action === 'sort') {
    url.toggleSort(key);
  } else if (props.action === 'group_by') {
    url.toggleGroupBy(key);
  } else if (props.action === 'column') {
    url.toggleColumn(key);
  } else if (props.action === 'filter') {
    emit('click', key);
  }
};

const toggleOption = (key) => {
  isMoreDialogOpen.value = false;
  url.toggleGroupBy(key);
};
</script>