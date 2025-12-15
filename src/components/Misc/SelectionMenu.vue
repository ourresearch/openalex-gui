<template>
  <div>
    <Popover v-model:open="isMenuOpen">
      <PopoverTrigger asChild>
        <slot name="activator" :props="{}" :isMenuOpen="isMenuOpen">
          <Button
            :size="buttonStyle === 'fab' ? 'lg' : 'default'"
            :variant="buttonStyle === 'icon' ? 'ghost' : 'default'"
            :class="buttonStyle === 'fab' ? 'rounded-full h-14 w-14' : ''"
          >
            <Plus class="h-5 w-5" />
          </Button>
        </slot>
      </PopoverTrigger>

      <PopoverContent class="w-72 p-0" :align="location.includes('left') ? 'start' : 'end'">
        <div class="flex items-center border-b p-2">
          <Search class="h-4 w-4 mr-2 text-primary" />
          <input
            v-model="searchString"
            ref="initialInput"
            :placeholder="searchPlaceholder"
            class="flex-1 bg-transparent outline-none text-sm"
            @keyup.enter="onEnter"
            @keydown.down="onDownArrow"
          />
        </div>
        
        <ScrollArea class="max-h-[50vh]">
          <div v-if="searchString" class="p-1">
            <template v-if="searchResults.length > 0">
              <button
                v-for="key in searchResults"
                :key="key"
                @click="selectOption(key)"
                :disabled="disabledKeys?.includes(key)"
                class="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <component :is="getIconComponent(getIcon(key))" class="h-4 w-4 shrink-0" />
                <span class="flex-1">{{ getDisplayName(key) }}</span>
                <Check v-if="isStateful && selectedKeys?.includes(key)" class="h-4 w-4" />
              </button>
            </template>
            <template v-else>
              <p class="p-2 text-sm text-muted-foreground">No matching options.</p>
            </template>
          </div>

          <div v-if="!searchString" class="p-1">
            <button
              v-for="key in popularKeys"
              :key="key"
              @click="selectOption(key)"
              :disabled="disabledKeys?.includes(key)"
              class="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <component :is="getIconComponent(getIcon(key))" class="h-4 w-4 shrink-0" />
              <span class="flex-1">{{ getDisplayName(key) }}</span>
              <Check v-if="isStateful && selectedKeys?.includes(key)" class="h-4 w-4" />
            </button>
            <Separator class="my-1" />
            <button
              @click="openMoreDialog"
              class="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm font-medium"
            >
              <MoreHorizontal class="h-4 w-4" />
              More
            </button>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <!-- More Dialog with Multi-Column Layout -->
    <Dialog :open="isMoreDialogOpen" @update:open="isMoreDialogOpen = $event">
      <DialogContent class="sm:max-w-[800px] p-0">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="font-semibold">{{ moreDialogTitle }}</h3>
          <Button variant="ghost" size="icon" @click="closeMoreDialog">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="flex items-center border-b px-4 py-2">
          <Search class="h-4 w-4 mr-2 text-primary" />
          <input
            v-model="moreSearchString"
            autofocus
            placeholder="Search all"
            class="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <ScrollArea class="h-[60vh] p-2">
          <div class="flex flex-wrap">
            <button
              v-for="key in moreSearchResults"
              :key="key"
              @click="selectOption(key)"
              :disabled="disabledKeys?.includes(key) || (isStateful && selectedKeys?.includes(key))"
              class="flex items-start gap-2 p-2 rounded-md hover:bg-accent text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style="flex: 0 1 250px; min-width: 0;"
            >
              <component :is="getIconComponent(getIcon(key))" class="h-4 w-4 mt-0.5 shrink-0" />
              <span>{{ getDisplayName(key) }}</span>
            </button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';

import { Plus, Search, Check, MoreHorizontal, X, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign, Calendar, Tag, Lock, Unlock, Globe, Hash, BarChart3 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

defineOptions({ name: 'SelectionMenu' });

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
  'mdi-tag': Tag,
  'mdi-lock': Lock,
  'mdi-lock-open': Unlock,
  'mdi-earth': Globe,
  'mdi-pound': Hash,
  'mdi-chart-bar': BarChart3,
};

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || Tag;
}

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


<style scoped>
/* Minimal scoped styles */
</style>
