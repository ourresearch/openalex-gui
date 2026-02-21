<template>
  <div class="alerts-page" style="min-height: 50vh;">
    <h1 class="text-h5 font-weight-bold mb-4">Alerts</h1>

    <v-card flat class="rounded-o px-2 pb-4">
      <v-table v-if="alertSearches.length">
        <thead>
        <tr>
          <th>Name</th>
          <th>Last updated</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr
          v-for="search in alertSearches"
          :key="search.id"
          @click="openSavedSearch(search.id)"
          class="alert-row"
        >
          <td>
            <v-icon color="grey" start>mdi-bell</v-icon>
            {{ search.name }}
          </td>
          <td>
            {{ formatDate(search.updated) }}
          </td>
          <td class="text-right">
            <v-btn
              icon
              variant="plain"
              @click.stop="confirmRemoveAlert(search)"
            >
              <v-icon>mdi-bell-minus-outline</v-icon>
              <v-tooltip activator="parent" location="top">Remove alert</v-tooltip>
            </v-btn>
          </td>
        </tr>
        </tbody>
      </v-table>
      <div class="color-3 d-flex my-12 mx-4 pa-12" v-else>
        <div class="text-grey">
          You have no alerts. Create one from any works search using the three-dot menu.
        </div>
      </div>
    </v-card>

    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card rounded>
        <v-card-title>Remove this alert?</v-card-title>
        <v-card-text>
          You'll stop receiving alerts for "{{ alertToRemove?.name }}". The saved search will not be deleted.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="removeAlert">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { isToday } from '@/util';

defineOptions({ name: 'MeAlerts' });

useHead({ title: 'Alerts' });

const store = useStore();

const showConfirmDialog = ref(false);
const alertToRemove = ref(null);

const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);
const alertSearches = computed(() => userSavedSearches.value.filter(s => s.has_alert));

const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);

function confirmRemoveAlert(search) {
  alertToRemove.value = search;
  showConfirmDialog.value = true;
}

async function removeAlert() {
  showConfirmDialog.value = false;
  await store.dispatch('user/updateSearchAlert', {
    id: alertToRemove.value.id,
    has_alert: false,
  });
  alertToRemove.value = null;
}

const formatDate = (dateString) => {
  const dateOptions = { month: 'short', day: 'numeric' };
  const timeOptions = { timeStyle: 'short' };
  const updatedDate = new Date(dateString + '+0000');
  return isToday(updatedDate)
    ? updatedDate.toLocaleTimeString(undefined, timeOptions)
    : updatedDate.toLocaleDateString(undefined, dateOptions);
};
</script>

<style lang="scss">
.alerts-page {
  .alert-row {
    cursor: pointer;
  }
  table {
    border-top: none !important;
  }
}
</style>
