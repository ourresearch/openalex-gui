<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-2">Affiliation Linking</h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Manage how OpenAlex links author affiliation statements to your institution<span v-if="organization?.name"> ({{ organization.name }})</span>.
    </p>

    <!-- Affiliation Panel -->
    <AffiliationMatchingPanel :institution-id="myInstitutionId" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import AffiliationMatchingPanel from '@/components/AffiliationMatchingPanel.vue';

defineOptions({ name: 'SettingsAffiliations' });

useHead({ title: 'Affiliation Matching' });

const store = useStore();

// Organization data
const organization = ref(null);

// Computed
const organizationId = computed(() => store.state.user.organizationId);
const myInstitutionId = computed(() => {
  const openalexId = organization.value?.openalex_id;
  if (!openalexId) return null;
  if (openalexId.startsWith('https://openalex.org/')) {
    return openalexId.replace('https://openalex.org/', '');
  }
  return openalexId;
});

// Watchers
watch(organizationId, async (newId, oldId) => {
  if (newId !== oldId) {
    await fetchOrganization();
  }
});

// Lifecycle
onMounted(async () => {
  await fetchOrganization();
});

async function fetchOrganization() {
  if (!organizationId.value) return;
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (err) {
    console.error('Error fetching organization:', err);
  }
}
</script>
