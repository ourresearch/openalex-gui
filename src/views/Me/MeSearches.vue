<template>
  <div class="min-h-[50vh]">
    <!-- Page title -->
    <h1 class="text-xl font-bold mb-4">Saved Searches</h1>

    <!-- Controls row: Search -->
    <div v-if="userSavedSearches.length" class="flex items-center gap-3 mb-4">
      <div class="relative max-w-[320px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search saved searches"
          class="pl-9 pr-8"
          @keydown.escape="clearSearch"
        />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          @click="clearSearch"
        >
          <X class="h-3 w-3" />
        </Button>
      </div>
      <div class="flex-1"></div>
    </div>

    <Card class="rounded-lg px-2 pb-4">
      <Table v-if="filteredSearches.length">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="savedSearch in filteredSearches"
            :key="savedSearch.id"
            @click="openSavedSearch(savedSearch.id)"
            class="cursor-pointer"
          >
            <TableCell>
              <div class="flex items-center gap-2">
                <FolderOpen class="h-4 w-4 text-muted-foreground" />
                {{ savedSearch.name }}
              </div>
            </TableCell>
            <TableCell>
              {{ formatDate(savedSearch.updated) }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" @click.stop="setEditAlertId(savedSearch.id)">
                  <Bell v-if="savedSearch.has_alert" class="h-4 w-4" />
                  <BellOff v-else class="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" @click.stop>
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <saved-search-menu :id="savedSearch.id"/>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div class="flex my-12 mx-4 p-12" v-else>
        <div class="text-muted-foreground">
          You have no saved searches.
        </div>
      </div>
    </Card>
      
    <Dialog v-model:open="isDialogOpen.rename">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rename saved search</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <Input
            autofocus
            placeholder="New name"
            v-model="renameString"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen.rename = false">Cancel</Button>
          <Button @click="rename(searchIdToRename, renameString)">Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { Search, X, FolderOpen, Bell, BellOff, MoreVertical } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';

import { isToday } from '@/util';

import SavedSearchMenu from '@/components/SavedSearch/SavedSearchMenu.vue';

defineOptions({ name: 'SavedSearches' });

useHead({ title: 'Saved Searches' });

const store = useStore();

const renameString = ref('');
const searchQuery = ref('');
const isDialogOpen = reactive({
  rename: false,
});
const searchIdToRename = ref(null);

const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);

const filteredSearches = computed(() => {
  if (!searchQuery.value.trim()) return userSavedSearches.value;
  const q = searchQuery.value.toLowerCase().trim();
  return userSavedSearches.value.filter(s => 
    s.name?.toLowerCase().includes(q)
  );
});

function clearSearch() {
  searchQuery.value = '';
}

const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);
const setEditAlertId = (id) => store.commit('user/setEditAlertId', id);

// Methods
const rename = (id, newName) => {
  console.log('rename search', id, newName);
  isDialogOpen.rename = false;
  searchIdToRename.value = null;
};

const formatDate = (dateString) => {
  const dateOptions = {
    month: 'short',
    day: 'numeric',
  };
  const timeOptions = {
    timeStyle: 'short',
  };

  const updatedDate = new Date(dateString + '+0000'); // server gives us UTC

  return isToday(updatedDate)
    ? updatedDate.toLocaleTimeString(undefined, timeOptions)
    : updatedDate.toLocaleDateString(undefined, dateOptions);
};
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>
