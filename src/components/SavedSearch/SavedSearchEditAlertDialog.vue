<template>
  <v-dialog v-model="isOpen" max-width="300">
      <v-card flat rounded :loading="isLoading"  v-if="userId">
        <v-card-title>
          <v-icon start>{{ hasAlert ? "mdi-bell-minus" : "mdi-bell-plus "}}</v-icon>
          {{ hasAlert ? "Remove alert?" : "Create alert?" }}
        </v-card-title>
        <v-card-text>
          <template v-if="hasAlert">
            You'll no longer get emails when new results appear in this search.
          </template>
          <template v-else>
            You'll get an email when new results appear in this search.
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="isOpen = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="toggleAlerts">
            {{ hasAlert ? "Remove alert" : "Create alert"}}
          </v-btn>
        </v-card-actions>
      </v-card>
    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        You have to login edit alerts.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded to="/login">Log in</v-btn>
          <v-btn variant="flat" rounded color="primary" to="signup">Sign up</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'SavedSearchEditAlertDialog' });

const store = useStore();

const isLoading = ref(false);

// Vuex getters
const userId = computed(() => store.getters['user/userId']);
const editAlertId = computed(() => store.getters['user/editAlertId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);

const isOpen = computed({
  get() {
    return !!editAlertId.value;
  },
  set(to) {
    store.commit('user/setEditAlertId', to);
  },
});

const hasAlert = computed(() => {
  return userSavedSearches.value.find(s => s.id === editAlertId.value)?.has_alert;
});

// Vuex actions and mutations
const updateSearchAlert = (payload) => store.dispatch('user/updateSearchAlert', payload);

// Methods
async function toggleAlerts() {
  isLoading.value = true;
  console.log('toggle alerts', editAlertId.value);
  await updateSearchAlert({
    id: editAlertId.value,
    has_alert: !hasAlert.value,
  });
  isLoading.value = false;
  isOpen.value = false;
}
</script>


<style scoped lang="scss">

</style>