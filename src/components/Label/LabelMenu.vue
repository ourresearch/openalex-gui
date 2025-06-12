<template>
  <div style="display: inline-block;">
    <v-menu content-class="label-menu" max-width="400px">
      <template v-slot:activator="{ props }">
        <v-btn size="small" :icon="icon" variant="plain" v-bind="props" :disabled="!selectedIds.length">
          <v-icon size="small" >mdi-tag-outline</v-icon>
          <span v-if="!icon">Labels</span>
        </v-btn>
      </template>

      <v-list>
        <v-list-subheader>Apply Label:</v-list-subheader>
        <v-list-item
          v-for="label in availableLabels"
          :key="label.id"
          @click="toggle(label.id)"
        >
          <template #prepend>
            <v-icon @click.stop="toggle(label.id)">{{ checkIcon(label.id) }}</v-icon>
          </template>
          <v-list-item-title>{{ label.name }}</v-list-item-title>
          
        </v-list-item>

        <v-divider/>
        
        <v-list-item
          key="create-label"
          @click="isCreateLabelDialogOpen = true"
        >
          <template #prepend>
            <v-icon>mdi-tag-plus-outline</v-icon>
          </template>
          <v-list-item-title>New Label</v-list-item-title>
          
        </v-list-item>
        <v-list-item
          key="manage-labels"
          to="/me/labels"
        >
          <template #prepend>
            <v-icon>mdi-tag-edit-outline</v-icon>
          </template>
          <v-list-item-title>Manage Labels</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="isCreateLabelDialogOpen" width="500">
      <label-create :ids="selectedIds" :entityType="querySubjectEntity" @close="isCreateLabelDialogOpen = false"/>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
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

const checkIcon = (collectionId) => {
  const collection = collectionById(collectionId);
  if (props.selectedIds.every(selectedId => collection.ids.includes(selectedId))) {
    return 'mdi-checkbox-outline';
  } else if (props.selectedIds.some(selectedId => collection.ids.includes(selectedId))) {
    return 'mdi-minus-box-outline';
  } else {
    return 'mdi-checkbox-blank-outline';
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
  checkIcon(collectionId) === 'mdi-checkbox-outline' ? removeIds(collectionId) : addIds(collectionId);
};
</script>


<style>
.label-menu .v-subheader {
  height: 25px;
}
</style>