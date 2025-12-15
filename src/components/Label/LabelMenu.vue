<template>
  <div class="inline-block">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" :disabled="!selectedIds.length" :class="icon ? 'h-9 w-9 p-0' : ''">
          <Tag class="h-5 w-5" />
          <span v-if="!icon" class="ml-1">Labels</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="w-64">
        <DropdownMenuLabel>Apply Label:</DropdownMenuLabel>
        <DropdownMenuItem
          v-for="label in availableLabels"
          :key="label.id"
          @click="toggle(label.id)"
          class="cursor-pointer"
        >
          <component :is="getCheckIcon(label.id)" class="h-4 w-4 mr-2" />
          {{ label.name }}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          @click="isCreateLabelDialogOpen = true"
          class="cursor-pointer"
        >
          <TagIcon class="h-4 w-4 mr-2" />
          New Label
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <router-link to="/me/labels" class="flex items-center cursor-pointer">
            <Tags class="h-4 w-4 mr-2" />
            Manage Labels
          </router-link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog :open="isCreateLabelDialogOpen" @update:open="isCreateLabelDialogOpen = $event">
      <DialogContent class="sm:max-w-[500px] p-0">
        <label-create :ids="selectedIds" :entityType="querySubjectEntity" @close="isCreateLabelDialogOpen = false"/>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { Tag, Tags, TagIcon, CheckSquare, MinusSquare, Square } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import LabelCreate from '@/components/Label/LabelCreate.vue';

defineOptions({ name: 'LabelMenu' });

const props = defineProps({
  selectedIds: Array,
  icon: { type: Boolean, default: true }
});

const store = useStore();
const isCreateLabelDialogOpen = ref(false);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);
const userCollections = computed(() => store.getters['user/userCollections']);
const availableLabels = computed(() => store.getters['user/getCollectionsByType'](querySubjectEntity.value));

const updateCollectionIds = (payload) => store.dispatch('user/updateCollectionIds', payload);

const collectionById = (id) => userCollections.value.find(coll => coll.id === id);

const getCheckIcon = (collectionId) => {
  const collection = collectionById(collectionId);
  if (props.selectedIds.every(selectedId => collection.ids.includes(selectedId))) {
    return CheckSquare;
  } else if (props.selectedIds.some(selectedId => collection.ids.includes(selectedId))) {
    return MinusSquare;
  } else {
    return Square;
  }
}

const addIds = (collectionId) => {
  const collection = collectionById(collectionId);
  const newIds = [...new Set([...collection.ids, ...props.selectedIds])];
  updateCollectionIds({ collectionId, ids: newIds });
};

const removeIds = (collectionId) => {
  const collection = collectionById(collectionId);
  const newIds = collection.ids.filter(id => !props.selectedIds.includes(id));
  updateCollectionIds({ collectionId, ids: newIds });
};

const toggle = (collectionId) => {
  getCheckIcon(collectionId) === CheckSquare ? removeIds(collectionId) : addIds(collectionId);
};
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>