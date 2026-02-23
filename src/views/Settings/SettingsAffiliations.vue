<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Affiliation Linking</h1>

    <!-- Missing OpenAlex ID notice -->
    <v-alert
      v-if="organization && !myInstitutionId"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Your organization hasn't been linked to an OpenAlex institution yet. Please contact
      <a href="mailto:support@openalex.org">support@openalex.org</a>
      to get this set up.
    </v-alert>

    <!-- Affiliation Panel -->
    <AffiliationMatchingPanel v-else :institution-id="selectedInstitutionId">
      <template #institution-selector>
        <v-select
          v-model="selectedInstitution"
          :items="institutionOptions"
          item-title="display_name"
          item-value="id"
          return-object
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 280px;"
        />
      </template>
    </AffiliationMatchingPanel>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import AffiliationMatchingPanel from '@/components/AffiliationMatchingPanel.vue';

defineOptions({ name: 'SettingsAffiliations' });

useHead({ title: 'Affiliation Matching' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// Organization data
const organization = ref(null);
const selectedInstitution = ref(null);
const institutionOptions = ref([]);

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

const selectedInstitutionId = computed(() => {
  if (!selectedInstitution.value) return null;
  return normalizeInstitutionId(selectedInstitution.value.id);
});

function normalizeInstitutionId(id) {
  if (!id) return null;
  let normalized = id;
  if (normalized.startsWith('https://openalex.org/')) {
    normalized = normalized.replace('https://openalex.org/', '');
  }
  if (normalized.toUpperCase().startsWith('INSTITUTIONS/')) {
    normalized = normalized.substring('INSTITUTIONS/'.length);
  }
  return normalized.toUpperCase();
}

// Sync institution ID to URL
watch(selectedInstitutionId, (newId) => {
  const currentQuery = { ...route.query };
  if (newId && newId !== myInstitutionId.value) {
    currentQuery.institution = newId;
  } else {
    delete currentQuery.institution;
  }
  router.replace({ query: currentQuery });
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

    if (myInstitutionId.value) {
      await fetchDescendants(myInstitutionId.value);
    }
  } catch (err) {
    console.error('Error fetching organization:', err);
  }
}

async function fetchDescendants(institutionId) {
  try {
    const res = await axios.get(
      `https://api.openalex.org/institutions?filter=lineage:${institutionId}&select=id,display_name&per_page=200`
    );
    institutionOptions.value = (res.data.results || []).map(inst => ({
      id: inst.id,
      display_name: inst.display_name,
    }));

    // Select from URL param or default to own institution
    const urlInstitutionId = route.query.institution;
    if (urlInstitutionId) {
      const match = institutionOptions.value.find(
        opt => normalizeInstitutionId(opt.id) === urlInstitutionId.toUpperCase()
      );
      selectedInstitution.value = match || institutionOptions.value[0] || null;
    } else {
      // Default to own institution
      const ownMatch = institutionOptions.value.find(
        opt => normalizeInstitutionId(opt.id) === myInstitutionId.value
      );
      selectedInstitution.value = ownMatch || institutionOptions.value[0] || null;
    }
  } catch (err) {
    console.error('Error fetching descendant institutions:', err);
    institutionOptions.value = [];
  }
}
</script>
