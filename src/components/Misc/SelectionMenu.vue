<template>
  <div>
    <v-menu 
      v-model="isMenuOpen"
      :location="location"
      :offset="offset"
      :close-on-content-click="false"
    >
      <template #activator="{ props }">
        <slot name="activator" :props="props" :isMenuOpen="isMenuOpen">
          <v-btn
            v-bind="props"
            :icon="buttonStyle === 'icon'"
            :size="buttonStyle === 'fab' ? 'large' : 'default'"
            :color="buttonStyle === 'fab' ? 'primary' : 'grey-darken-2'"
            :class="buttonStyle === 'fab' ? 'rounded-circle' : ''"
            :variant="buttonStyle === 'icon' ? 'text' : 'elevated'"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </slot>
      </template>

      <v-card class="selection-menu-card rounded-o">
        <v-text-field
          v-model="searchString"
          ref="initialInput"
          variant="plain"
          hide-details
          autofocus
          :placeholder="searchPlaceholder"
          @keyup.enter="onEnter"
          @keydown.down="onDownArrow"
        >
          <template #prepend-inner>
            <v-icon color="primary" class="ml-4">mdi-magnify</v-icon>
          </template>
        </v-text-field>

        <v-divider/>
        
        <v-list v-if="searchString">
          <template v-if="searchResults.length > 0">
            <v-list-item
              v-for="key in searchResults"
              :key="key"
              @click="selectOption(key)"
              :disabled="disabledKeys?.includes(key)"
            >
              <template #prepend>
                <v-icon :disabled="disabledKeys?.includes(key)">{{ getIcon(key) }}</v-icon>
              </template>
              <v-list-item-title>
                {{ getDisplayName(key) }}
              </v-list-item-title>
              <template #append v-if="isStateful && selectedKeys?.includes(key)">
                <v-icon>mdi-check</v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-else>
            <v-list-item>
              <v-list-item-title class="text-grey">No matching options.</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>

        <v-list v-if="!searchString">
          <v-list-item
            v-for="key in popularKeys"
            :key="key"
            @click="selectOption(key)"
            :disabled="disabledKeys?.includes(key)"
          >
            <template #prepend>
              <v-icon :disabled="disabledKeys?.includes(key)">{{ getIcon(key) }}</v-icon>
            </template>
            <v-list-item-title>
              {{ getDisplayName(key) }}
            </v-list-item-title>
            <template #append v-if="isStateful && selectedKeys?.includes(key)">
              <v-icon>mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-divider/>
          <v-list-item
            key="more-options"
            @click="openMoreDialog"
          >
            <template #prepend>
              <v-icon>mdi-dots-horizontal</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">
              More
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <!-- More Dialog with Multi-Column Layout -->
    <v-dialog
      v-model="isMoreDialogOpen"
      scrollable
      width="800"
    >
      <v-card rounded>
        <v-toolbar flat>
          <div class="text-h6">{{ moreDialogTitle }}</div>
          <v-spacer/>
          <v-btn icon @click="closeMoreDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-divider/>

        <v-text-field
          v-model="moreSearchString"
          variant="plain"
          hide-details
          autofocus
          placeholder="Search all"
          class="mx-4 mt-3"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-magnify</v-icon>
          </template>
        </v-text-field>

        <v-divider class="mt-3"/>

        <v-card-text class="pa-0">
          <v-list class="d-flex flex-wrap" nav>
            <v-list-item
              v-for="key in moreSearchResults"
              :key="key"
              @click="selectOption(key)"
              :disabled="disabledKeys?.includes(key) || (isStateful && selectedKeys?.includes(key))"
              style="        
                flex: 0 1 250px; 
                min-width: 0;
                align-items: flex-start;"
            >
              <template #prepend>
                <v-icon :disabled="disabledKeys?.includes(key) || (isStateful && selectedKeys?.includes(key))">{{ getIcon(key) }}</v-icon>
              </template>
              <v-list-item-title class="selection-menu-item-title">
                {{ getDisplayName(key) }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';

defineOptions({ name: 'SelectionMenu' });

const props = defineProps({
  allKeys: {
    type: Array,
    required: true
  },
  popularKeys: {
    type: Array,
    default: () => []
  },
  selectedKeys: {
    type: Array,
    default: () => []
  },
  disabledKeys: {
    type: Array,
    default: () => []
  },
  getDisplayName: {
    type: Function,
    required: true
  },
  getIcon: {
    type: Function,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search all'
  },
  moreDialogTitle: {
    type: String,
    default: 'More Options'
  },
  location: {
    type: String,
    default: 'bottom'
  },
  offset: {
    type: [Array, Object],
    default: () => [0, 0]
  },
  buttonStyle: {
    type: String,
    default: 'fab',
    validator: (value) => ['fab', 'icon'].includes(value)
  },
  isStateful: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'toggle']);

const isMenuOpen = ref(false);
const isMoreDialogOpen = ref(false);
const searchString = ref('');
const moreSearchString = ref('');
const initialInput = ref(null);

const searchResults = computed(() => {
  const query = searchString.value.toLowerCase();
  return props.allKeys.filter(key =>
    props.getDisplayName(key).toLowerCase().includes(query)
  );
});

const moreSearchResults = computed(() => {
  const query = moreSearchString.value.toLowerCase();
  return props.allKeys.filter(key =>
    props.getDisplayName(key).toLowerCase().includes(query)
  );
});

function selectOption(key) {
  if (props.isStateful && props.selectedKeys?.includes(key)) {
    emit('toggle', key);
  } else {
    emit('select', key);
  }
  isMenuOpen.value = false;
  isMoreDialogOpen.value = false;
  searchString.value = '';
  moreSearchString.value = '';
}

function openMoreDialog() {
  isMenuOpen.value = false;
  isMoreDialogOpen.value = true;
}

function closeMoreDialog() {
  isMoreDialogOpen.value = false;
  moreSearchString.value = '';
}

function onDownArrow(event) {
  event.preventDefault();
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(focusable))
    .filter(el => !el.disabled && el.offsetParent !== null);
  const currentIndex = elements.indexOf(event.target);
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  } else if (elements.length > 0) {
    elements[0].focus();
  }
}

function onEnter() {
  if (searchResults.value.length === 1) {
    selectOption(searchResults.value[0]);
  }
}
</script>


<style scoped lang="scss">
.selection-menu-card {
  width: auto;
  max-height: 70vh;
  min-height: 200px;
  input {
    padding-top: 4px !important;
  }
  .v-field__prepend-inner, .v-field__append-inner {
    padding-top: 12px !important;
  }
}

.selection-menu-item-title {
  font-weight: normal !important;
  font-size: 16px !important;
  white-space: normal;
  overflow-wrap: break-word;
}
</style>
