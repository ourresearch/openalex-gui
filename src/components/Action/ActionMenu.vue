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
    <v-menu v-else class="rounded-lg">
      <template v-slot:activator="{props}">
        <v-btn v-on="on" icon size="large" color="" class="px-2 color-1 elevation-0" v-if="myConfig.id === 'filter'" style="min-width: 0;">
          <v-icon class="">mdi-plus</v-icon>
        </v-btn>
        <v-btn
          v-else
          icon
          variant="text"
          v-bind="props"
          class="rounded-lg"
          :disabled="disabled"
        >
          <template v-if="myConfig.id === 'sort'">
            <v-icon color="grey-darken-2">mdi-sort</v-icon>
          </template>
        </v-btn>
      </template>

      <v-card flat>
        <v-list>
          <v-list-subheader>
            <template v-if="myConfig.id === 'sort'">
              Sort by:
            </template>
            <template v-if="myConfig.id === 'filter'">
              Add filter:
            </template>
          </v-list-subheader>

          <v-divider/>
          
          <v-list-item
            v-for="key in menuOptions"
            :key="key"
            color="primary"
            :value="key"
            :disabled="myConfig?.disableKeys?.includes(key)"
            @click="clickOption(key)"
          >
            <template #prepend>
              <v-icon color="grey-darken-2">{{ getKeyIcon(key) }}</v-icon>
            </template>
            
            <v-list-item-title>
              {{ filters.titleCase(getKeyDisplayName(key)) }}
            </v-list-item-title>
            
            <template #append>
              <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>
            </template>
          </v-list-item>

          <v-divider/>
          
          <v-list-item @click="openMoreDialog">
            <v-list-item-title>More</v-list-item-title>
          </v-list-item>

        </v-list>
      </v-card>
    </v-menu>
    <v-dialog
      v-model="isMoreDialogOpen"
      scrollable
      max-width="400"
    >
      <v-card rounded>
        <v-toolbar flat>
          <div class="text-h6">More {{ myConfig.displayName }} Options</div>
          <v-spacer/>
          <v-btn icon @click="closeMoreDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-divider/>

        <v-card-text class="pa-0">
          <v-list-item
            v-for="key in allOptions"
            :key="key"
            color="primary"
            :value="key"
            :disabled="myConfig?.disableKeys?.includes(key)"
            @click="clickOption(key)"
          >
            <template #prepend>
              <v-icon>{{ getKeyIcon(key) }}</v-icon>
            </template>
            <v-list-item-title>
              {{ filters.titleCase(getKeyDisplayName(key)) }}
            </v-list-item-title>
            <v-list-item-action>
              <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { url } from '@/url';
import filters from '@/filters';
import { facetConfigs, getFacetConfig } from '@/facetConfigs';
import { getActionConfig } from '@/actionConfigs';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';

defineOptions({ name: 'ActionMenu' });

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