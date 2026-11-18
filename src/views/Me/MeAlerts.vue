<template>
  <div class="alerts-page" style="min-height: 50vh;">
    <h1 class="text-h5 font-weight-bold mb-4">Alerts</h1>

    <v-card flat class="rounded-o px-2 pb-4">
      <!-- Grouped by what each alert follows, every group sortable by the same columns (oxjob #635). -->
      <template v-if="alertSearches.length">
        <section v-for="group in alertGroups" :key="group.key" class="alert-group">
          <h2 v-if="alertGroups.length > 1" class="text-subtitle-1 font-weight-bold pt-4 px-4">
            {{ group.title }}
            <span class="text-medium-emphasis font-weight-regular">({{ group.items.length }})</span>
          </h2>
          <v-data-table
            v-model:sort-by="sortBy"
            :headers="headers"
            :items="group.items"
            :custom-key-sort="customKeySort"
            item-value="id"
            :items-per-page="-1"
            hide-default-footer
            density="comfortable"
            class="alert-table"
            @click:row="(event, { item }) => openSavedSearch(item.id)"
          >
            <template #item.name="{ item }">
              <div class="d-flex align-start py-2">
                <v-icon color="grey" start size="small" class="mt-1">mdi-bell</v-icon>
                <div>
                  {{ item.name }}
                  <!-- Alerts switched on before the API refused them, e.g. a works collection (oxjob #1505) -->
                  <div v-if="item.cannot_alert" class="text-caption text-medium-emphasis">
                    {{ item.cannot_alert.message }}
                  </div>
                </div>
              </div>
            </template>
            <template #item.alert_frequency="{ item }">
              <div @click.stop>
                <v-select
                  class="frequency-select"
                  :model-value="item.alert_frequency || 'daily'"
                  :items="frequencyOptions"
                  density="compact"
                  variant="plain"
                  hide-details
                  :aria-label="`Alert frequency for ${item.name}`"
                  @update:model-value="setFrequency(item, $event)"
                />
              </div>
            </template>
            <template #item.alert_last_sent="{ item }">
              {{ item.alert_last_sent ? formatDate(item.alert_last_sent) : 'Not yet' }}
            </template>
            <template #item.created="{ item }">
              {{ formatDate(item.created) }}
            </template>
            <template #item.actions="{ item }">
              <v-btn
                icon
                variant="plain"
                @click.stop="confirmRemoveAlert(item)"
              >
                <v-icon>mdi-bell-minus-outline</v-icon>
                <v-tooltip activator="parent" location="top" aria-label="Remove alert">Remove alert</v-tooltip>
              </v-btn>
            </template>
          </v-data-table>
        </section>
      </template>
      <!-- Empty state only once the list is known (oxjob #860: it loads in the background). -->
      <div class="color-3 d-flex my-12 mx-4 pa-12" v-else-if="savedSearchesLoaded">
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { isToday } from '@/util';
import { groupAlerts } from '@/views/Me/alertFollows';

defineOptions({ name: 'MeAlerts' });

useHead({ title: 'Alerts' });

const store = useStore();

const showConfirmDialog = ref(false);
const alertToRemove = ref(null);

const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);
const savedSearchesLoaded = computed(() => store.getters['user/savedSearchesLoaded']);
onMounted(() => store.dispatch('user/ensureSavedSearches'));
const alertSearches = computed(() => userSavedSearches.value.filter(s => s.has_alert));
const alertGroups = computed(() => groupAlerts(alertSearches.value));

// One sort for every group, so the groups read alike (oxjob #635).
const sortBy = ref([]);
const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Frequency', key: 'alert_frequency', sortable: true, width: '150px' },
  { title: 'Last sent', key: 'alert_last_sent', sortable: true, width: '120px' },
  { title: 'Created', key: 'created', sortable: true, width: '120px' },
  { title: '', key: 'actions', sortable: false, align: 'end', width: '60px' },
];
const FREQUENCY_ORDER = { daily: 0, weekly: 1, monthly: 2 };
const byDate = (a, b) => (a || '').localeCompare(b || '');   // ISO strings; an alert never sent sorts first
const customKeySort = {
  name: (a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base', numeric: true }),
  alert_frequency: (a, b) => FREQUENCY_ORDER[a || 'daily'] - FREQUENCY_ORDER[b || 'daily'],
  alert_last_sent: byDate,
  created: byDate,
};

const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);

const frequencyOptions = [
  { title: 'Daily', value: 'daily' },
  { title: 'Weekly', value: 'weekly' },
  { title: 'Monthly', value: 'monthly' },
];

function setFrequency(search, alert_frequency) {
  if (alert_frequency === (search.alert_frequency || 'daily')) return;
  store.dispatch('user/updateSearchFrequency', { id: search.id, alert_frequency });
}

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
  .alert-table tbody tr {
    cursor: pointer;
  }
  .frequency-select {
    max-width: 130px;
    .v-field__input {
      padding-top: 0;
      padding-bottom: 0;
      font-size: 14px;
    }
  }
  table {
    border-top: none !important;
  }
}
</style>
