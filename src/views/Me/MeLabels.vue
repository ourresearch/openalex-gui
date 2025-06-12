<template>
  <div>
    <div v-if="!labelId" class="mb-2">
      <span class="text-h4 ml-1 mr-3">Labels</span>
      <v-btn 
        @click="isLabelCreateDialogOpen = true"
        color="primary"
        size="small"
        class="new-label-button">
        <v-icon start>mdi-plus</v-icon>New Label
      </v-btn>
    </div>
    
    <router-view v-if="labelId" />
    
    <v-card v-else flat rounded class="mb-6">
      
      <v-card-text v-if="!userCollections.length">
        Create labels for authors, institutions, and more that you can use to fitler your searches.
      </v-card-text>
      
      <v-list v-else>
        <v-list-item
            v-for="label in userCollections"
            :key="label.id"
            :to="'/me/labels/' + label.id"
        >
          <template #prepend>
            <v-icon>mdi-tag-outline</v-icon>
          </template>
          
          <v-list-item-title>{{ label.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ label.ids.length + " " + label.entity_type}}</v-list-item-subtitle>
          
          <template #append>  
            <v-btn icon variant="plain" @click.stop.prevent="deleteCollection(label.id)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="isLabelCreateDialogOpen" width="400">
      <label-create @close="isLabelCreateDialogOpen = false" :full="true" />
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import LabelCreate from '@/components/Label/LabelCreate.vue';

defineOptions({ name: 'MeLabels' });

const store = useStore();
const route = useRoute();

const isLabelCreateDialogOpen = ref(false);
const labelId = computed(() => route.params.labelId || null);
const userCollections = computed(() => store.getters['user/userCollections']);

const deleteCollection = async (id) => {
  await store.dispatch('user/deleteCollection', id);
};
</script>


<style scoped lang="scss">
.new-label-button {
  margin-top: -13px;
}
</style>