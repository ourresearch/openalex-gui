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
          @update:model-value="(val) => toggleFlag(flag.name, val)"
          color="primary"
          hide-details
          density="compact"
          :loading="togglingFlag === flag.name"
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
    allFlags.value = resp.data.results || [];
  } catch (e) {
    console.error('Failed to fetch feature flags:', e);
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
  } finally {
    togglingFlag.value = null;
  }
}

onMounted(fetchFlags);
</script>
