<template>
  <div>
    <v-menu class="rounded-lg">
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
          <template v-if="myConfig.id === 'group_by'">
            <v-icon color="grey-darken-2">mdi-plus</v-icon>
          </template>
        </v-btn>
      </template>

      <v-card flat>
        <v-list>
          <v-list-subheader>
            <template v-if="myConfig.id === 'sort'">
              Sort by:
            </template>
            <template v-if="myConfig.id === 'group_by'">
              Add to report:
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
const selectedOptions = computed(() => url.getActionValueKeys(route, props.action));

const allOptions = computed(() =>
  facetConfigs(entityType.value)
    .filter(conf => conf.actions?.includes(props.action))
    .map(conf => conf.key)
);

const popularOptions = computed(() =>
  facetConfigs(entityType.value)
    .filter(conf => conf.actionsPopular?.includes(props.action))
    .map(conf => conf.key)
);

const menuOptions = computed(() => {
  const result = [...popularOptions.value];
  selectedOptions.value.forEach(optionKey => {
    if (!popularOptions.value.includes(optionKey)) {
      result.push(optionKey);
    }
  });
  return result;
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
</script>