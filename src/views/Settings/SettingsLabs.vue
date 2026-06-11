<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-2">Labs</h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Try experimental features before they're released. Experiments may change or disappear at any time.
    </p>

    <SettingsSection title="Experiments">
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate size="24" />
      </div>
      <template v-else>
        <SettingsRow
          v-for="exp in experiments"
          :key="exp.name"
          :label="exp.title"
          :description="exp.description"
        >
          <v-switch
            :model-value="exp.enabled"
            @click="toggleExperiment(exp)"
            color="primary"
            hide-details
            density="compact"
            :loading="toggling === exp.name"
            :readonly="true"
          />
        </SettingsRow>
        <SettingsRow
          v-if="experiments.length === 0"
          label="No experiments right now"
          description="Check back later — new experiments show up here."
        />
      </template>
    </SettingsSection>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'SettingsLabs' });

useHead({ title: 'Labs' });

const store = useStore();

const experiments = ref([]);
const loading = ref(true);
const toggling = ref(null);

const userId = computed(() => store.state.user.id);

async function fetchExperiments() {
  loading.value = true;
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/experiments`,
      axiosConfig({ userAuth: true })
    );
    experiments.value = resp.data.results || [];
  } catch (e) {
    console.error('Failed to fetch experiments:', e);
    experiments.value = [];
  } finally {
    loading.value = false;
  }
}

async function toggleExperiment(exp) {
  const enable = !exp.enabled;
  toggling.value = exp.name;
  try {
    const url = `${urlBase.userApi}/users/${userId.value}/feature-flags/${exp.name}`;
    const config = axiosConfig({ userAuth: true });
    if (enable) {
      await axios.put(url, {}, config);
    } else {
      await axios.delete(url, config);
    }
    exp.enabled = enable;
    // The store ORs localFeatureFlags (AdminExperimental's offline fallback)
    // into the backend flags, which would mask a server-side "off" — scrub it.
    const localFlags = JSON.parse(localStorage.getItem('localFeatureFlags') || '[]');
    if (localFlags.includes(exp.name)) {
      localStorage.setItem('localFeatureFlags', JSON.stringify(localFlags.filter(f => f !== exp.name)));
    }
    await store.dispatch('user/fetchUser');
    store.commit('snackbar', `${exp.title} turned ${enable ? 'on' : 'off'}`);
  } catch (e) {
    console.error('Failed to toggle experiment:', e);
    store.commit('snackbar', "Sorry, that didn't work — try again.");
  } finally {
    toggling.value = null;
  }
}

onMounted(fetchExperiments);
</script>
