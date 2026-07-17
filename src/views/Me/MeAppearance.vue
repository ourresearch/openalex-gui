<template>
  <div class="appearance-page" style="min-height: 50vh;">
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-1">Appearance</h1>
    <div class="text-body-2 text-medium-emphasis mb-6">
      Saved column views for the results table. Save one from the table's
      add-column menu; load or delete them here or there.
    </div>

    <h2 class="text-subtitle-1 font-weight-bold mb-2">Column views</h2>
    <v-card flat class="rounded-o px-2 pb-4">
      <v-table v-if="columnViews.length">
        <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Columns</th>
          <th>Created</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr
          v-for="view in columnViews"
          :key="view.id"
        >
          <td>
            <v-icon color="grey" start>mdi-folder-open-outline</v-icon>
            {{ view.name }}
          </td>
          <td>
            {{ filters.capitalize(view.entity_type) }}
          </td>
          <td class="column-list text-medium-emphasis">
            {{ columnLabels(view) }}
          </td>
          <td>
            {{ formatDate(view.created) }}
          </td>
          <td class="text-right">
            <v-btn
              icon
              variant="text"
              size="small"
              :aria-label="`Delete view ${view.name}`"
              @click="deleteView(view)"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </td>
        </tr>
        </tbody>
      </v-table>
      <div class="color-3 d-flex my-12 mx-4 pa-12" v-else>
        <div class="text-grey">
          You have no saved column views.
        </div>
      </div>
    </v-card>
  </div>
</template>


<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import filters from '@/filters';
import { isToday } from '@/util';
import { resolveColumn } from '@/components/Results/Table/columnConfig';

defineOptions({ name: 'MeAppearance' });

useHead({ title: 'Appearance' });

const store = useStore();

const columnViews = computed(() => store.getters['user/userColumnViews']);

onMounted(() => {
  store.dispatch('user/fetchSerpViews', 'columns').catch((e) => {
    console.warn('MeAppearance: failed to fetch column views', e);
  });
});

function columnLabels(view) {
  return view.columns
    .map((key) => filters.capitalize(resolveColumn(view.entity_type, key)?.label ?? key))
    .join(', ');
}

function deleteView(view) {
  store.dispatch('user/deleteSerpView', { id: view.id, kind: 'columns' })
    .then(() => {
      store.commit('snackbar', `Deleted view "${view.name}"`);
    })
    .catch((e) => {
      console.warn('MeAppearance: failed to delete column view', e);
      store.commit('snackbar', 'Could not delete view');
    });
}

const formatDate = (dateString) => {
  const dateOptions = {
    month: 'short',
    day: 'numeric',
  };
  const timeOptions = {
    timeStyle: 'short',
  };

  const createdDate = new Date(dateString + '+0000'); // server gives us UTC

  return isToday(createdDate)
    ? createdDate.toLocaleTimeString(undefined, timeOptions)
    : createdDate.toLocaleDateString(undefined, dateOptions);
};
</script>


<style lang="scss" scoped>
.appearance-page {
  .column-list {
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  table {
    border-top: none !important;
  }
}
</style>
