<template>
  <div class="settings-page">
    <div class="settings-page-title">Feature Flags</div>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Toggle feature flags for your account.
    </p>

    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate size="24" />
    </div>

    <div v-else>
      <div
        v-for="flag in allFlags"
        :key="flag.name"
        class="d-flex align-center justify-space-between py-3"
        style="border-bottom: 1px solid #E5E5E5;"
      >
        <div>
          <div class="text-body-2 font-weight-medium">{{ flag.name }}</div>
          <div class="text-caption text-grey-darken-1">
            {{ flag.description }}
          </div>
        </div>
        <v-switch
          :model-value="isEnabled(flag.name)"
          @click="toggleFlag(flag.name, !isEnabled(flag.name))"
          color="primary"
          hide-details
          density="compact"
          :loading="togglingFlag === flag.name"
          :readonly="true"
        />
      </div>

      <div v-if="allFlags.length === 0" class="text-body-2 text-grey-darken-1">
        No feature flags defined.
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminFeatureFlags' });

import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

const store = useStore();

// UI-defined feature flags that may not yet exist in the backend
const UI_DEFINED_FLAGS = [
  {
    name: 'author_curation',
    description: 'Enable author profile claiming and curation features (display name editing, works add/remove, CV upload).',
  },
];

const allFlags = ref([]);
const loading = ref(true);
const togglingFlag = ref(null);

const userId = computed(() => store.state.user.id);
const featureFlags = computed(() => store.getters.featureFlags);

function isEnabled(flagName) {
  return !!featureFlags.value[flagName];
}

async function fetchFlags() {
  loading.value = true;
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/feature-flags`,
      axiosConfig({ userAuth: true })
    );
    const backendFlags = resp.data.results || [];

    // Merge: backend flags take precedence, then append UI-defined flags not in backend
    const backendNames = new Set(backendFlags.map(f => f.name));
    const uiOnly = UI_DEFINED_FLAGS.filter(f => !backendNames.has(f.name));
    allFlags.value = [...backendFlags, ...uiOnly];
  } catch (e) {
    console.error('Failed to fetch feature flags:', e);
    // Fallback: show UI-defined flags even if backend is unreachable
    allFlags.value = [...UI_DEFINED_FLAGS];
  } finally {
    loading.value = false;
  }
}

async function toggleFlag(flagName, enable) {
  togglingFlag.value = flagName;
  try {
    const url = `${urlBase.userApi}/users/${userId.value}/feature-flags/${flagName}`;
    const config = axiosConfig({ userAuth: true });
    if (enable) {
      await axios.put(url, {}, config);
    } else {
      await axios.delete(url, config);
    }
    await store.dispatch('user/fetchUser');
  } catch (e) {
    console.error('Failed to toggle feature flag:', e);
    // Client-side fallback: toggle locally when backend doesn't know the flag yet
    const currentFlags = Object.keys(featureFlags.value).filter(k => featureFlags.value[k]);
    if (enable) {
      store.commit('setFeatureFlags', [...currentFlags, flagName]);
    } else {
      store.commit('setFeatureFlags', currentFlags.filter(f => f !== flagName));
    }
  } finally {
    togglingFlag.value = null;
  }
}

onMounted(fetchFlags);
</script>
