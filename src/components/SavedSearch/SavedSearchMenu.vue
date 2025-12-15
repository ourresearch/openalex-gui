<template>
  <div>
    <template v-if="$route.name === 'Serp'">
      <DropdownMenuItem @click="newSearch">
        <Plus class="h-4 w-4 mr-2" />
        New
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger :disabled="!userId">
          <FolderOpen class="h-4 w-4 mr-2" />
          Open
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            v-for="search in searchesToOpen"
            :key="search.id"
            @click="openSearch(search.id)"
          >
            <Folder class="h-4 w-4 mr-2" />
            {{ search.name }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <router-link to="/me/searches" class="flex items-center">
              <Folders class="h-4 w-4 mr-2" />
              View all
            </router-link>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem :disabled="!id" @click="createSearchFromTemplate(id)">
        <Copy class="h-4 w-4 mr-2" />
        Make a copy
      </DropdownMenuItem>

      <DropdownMenuSeparator />
    </template>

    <DropdownMenuItem v-if="$route.name === 'Serp'" @click="$emit('save')">
      <Save class="h-4 w-4 mr-2" />
      Save {{ id ? "" : "As..." }}
    </DropdownMenuItem>

    <DropdownMenuItem :disabled="!id" @click="setRenameId(id)">
      <Pencil class="h-4 w-4 mr-2" />
      Rename
    </DropdownMenuItem>

    <DropdownMenuItem :disabled="!id" @click="deleteSavedSearch(id)">
      <Trash2 class="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem :disabled="!id" @click="$emit('toggle-alert')">
      <BellMinus v-if="activeSearchObj?.has_alert" class="h-4 w-4 mr-2" />
      <BellPlus v-else class="h-4 w-4 mr-2" />
      {{ activeSearchObj?.has_alert ? "Remove" : "Create" }} alert
    </DropdownMenuItem>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { Plus, FolderOpen, Folder, Folders, Copy, Save, Pencil, Trash2, BellMinus, BellPlus } from 'lucide-vue-next';

import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import { url } from '@/url';

defineOptions({ name: 'SavedSearchMenu' });

defineProps({
  id: String,
});

const emit = defineEmits(['close']);

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);

const searchesToOpen = computed(() => userSavedSearches.value);

// Vuex mutations
const snackbar = (msg) => store.commit('snackbar', msg);
const setRenameId = (id) => store.commit('user/setRenameId', id);

// Vuex actions
const deleteSavedSearch = (id) => store.dispatch('user/deleteSavedSearch', id);
const createSearchFromTemplate = (query) => store.dispatch('user/createSearchFromTemplate', query);
const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);

// Methods
function newSearch() {
  url.pushToRoute(router, { name: 'Serp' });
  // snackbar('New search created.');
}

function openSearch(id) {
  openSavedSearch(id);
  emit('close');
  snackbar('Search opened.');
}
</script>