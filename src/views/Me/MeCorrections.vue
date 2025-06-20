<template>
  <div>
    <div class="text-h4 ml-1">My Corrections</div>

    <v-card rounded border class="my-4">

      <v-alert type="warning" icon="mdi-progress-wrench">
        Support for submitting data correction will be coming soon.
      </v-alert>    

      <v-card-text v-if="!userCorrections.length">You haven't submitted any corrections yet.</v-card-text>
      <v-list v-else color="transparent">
        <v-list-item
            v-for="cor in userCorrections"
            :key="cor.id"
        >
          <v-icon>mdi-tag-outline</v-icon>
          
            <v-list-item-title>{{ cor.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ cor.comments }}</v-list-item-subtitle>
          
          <v-list-item-action>
            <v-btn icon @click="deleteCorrection(cor.id)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>

  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'MeCorrections' });

const store = useStore();

// Getters
const userCorrections = computed(() => store.getters['user/userCorrections']);

// Actions
const deleteCorrection = (id) => store.dispatch('user/deleteCorrection', id);
</script>