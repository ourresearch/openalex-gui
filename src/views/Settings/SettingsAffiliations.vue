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
          :items="filteredInstitutionOptions"
          item-title="display_name"
          item-value="id"
          return-object
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 280px;"
          :menu-props="{ width: 575 }"
          class="institution-select"
        >
          <template v-slot:prepend-item>
            <div style="display: flex; gap: 4px; padding: 6px 12px 8px; border-bottom: 1px solid #e0e0e0;">
              <v-chip
                v-for="mode in statusModes"
                :key="mode.value"
                :variant="statusFilterMode === mode.value ? 'flat' : 'outlined'"
                :color="statusFilterMode === mode.value ? 'primary' : undefined"
                size="small"
                density="compact"
                @click.stop="statusFilterMode = mode.value"
                style="cursor: pointer;"
              >{{ mode.label }}</v-chip>
            </div>
          </template>
          <template v-slot:item="{ item, props }">
            <v-list-item
              v-bind="props"
              :title="item.raw.display_name"
              :style="item.raw.status !== 'active' ? 'opacity: 0.55; font-style: italic;' : ''"
              class="institution-item"
            >
              <template v-slot:append v-if="item.raw.status !== 'active'">
                <v-chip size="x-small" color="grey" variant="outlined" class="ml-2">{{ item.raw.status }}</v-chip>
              </template>
            </v-list-item>
          </template>
        </v-select>
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
const statusFilterMode = ref('all');
const statusModes = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'All', value: 'all' },
];

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

// Filtered options based on status toggle
const filteredInstitutionOptions = computed(() => {
  if (statusFilterMode.value === 'all') return institutionOptions.value;
  if (statusFilterMode.value === 'inactive') return institutionOptions.value.filter(opt => opt.status !== 'active');
  return institutionOptions.value.filter(opt => opt.status === 'active');
});

// When the filter changes, ensure the selected institution is still in the filtered list
watch(statusFilterMode, () => {
  if (selectedInstitution.value && !filteredInstitutionOptions.value.find(
    opt => opt.id === selectedInstitution.value.id
  )) {
    // Re-select own institution or first available
    const ownMatch = filteredInstitutionOptions.value.find(
      opt => normalizeInstitutionId(opt.id) === myInstitutionId.value
    );
    selectedInstitution.value = ownMatch || filteredInstitutionOptions.value[0] || null;
  }
});

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

// Max ids per lineage: filter. The API rejects an over-long filter, and a big
// parent such as Inserm has 300+ children, so the OR-list has to be chunked.
const LINEAGE_CHUNK_SIZE = 50;

// Every institution whose lineage includes any of rootIds. Cursor-paged: Inserm
// alone has 405 descendants, so a single per_page=200 call would drop the tail.
async function fetchByLineage(rootIds) {
  const results = [];
  for (let i = 0; i < rootIds.length; i += LINEAGE_CHUNK_SIZE) {
    const roots = rootIds.slice(i, i + LINEAGE_CHUNK_SIZE).join('|');
    let cursor = '*';
    while (cursor) {
      const res = await axios.get(
        `https://api.openalex.org/institutions?filter=lineage:${roots}` +
        `&select=id,display_name,status&per_page=200&cursor=${cursor}`
      );
      results.push(...(res.data.results || []));
      cursor = res.data.meta?.next_cursor || null;
    }
  }
  return results;
}

async function fetchReseedIds(institutionId) {
  const res = await axios.get(
    `https://api.openalex.org/institutions/${institutionId}?select=id,associated_institutions`
  );
  return (res.data.associated_institutions || [])
    .filter(assoc => assoc.relationship === 'child' || assoc.relationship === 'predecessor')
    .map(assoc => normalizeInstitutionId(assoc.id));
}

async function fetchDescendants(institutionId) {
  try {
    const found = await fetchByLineage([institutionId]);
    const seen = new Set(found.map(inst => normalizeInstitutionId(inst.id)));

    // Two association types fall outside lineage and need re-seeding:
    //
    // A university system (UC, UT, CSU, UNC...) lists its campuses as `child`,
    // but OpenAlex deliberately keeps the system out of those campuses' lineage
    // -- so the query above returns the system alone and the org can curate
    // nothing beneath it.
    //
    // A merged university (Université de Toulouse and other post-merger orgs)
    // lists the entity it absorbed as `predecessor`. The old entity keeps
    // accumulating records from historical affiliation strings, and the
    // successor's curators are the only people left to fix them.
    //
    // Only the *uncovered* ids are re-seeded. Under an ordinary parent the
    // children are already in its lineage (Inserm: 314 of 314), so this adds no
    // ids, leaves the filter short, and keeps those orgs exactly as they were.
    const uncoveredIds = (await fetchReseedIds(institutionId))
      .filter(id => !seen.has(id));
    if (uncoveredIds.length) {
      for (const inst of await fetchByLineage(uncoveredIds)) {
        const id = normalizeInstitutionId(inst.id);
        if (!seen.has(id)) {
          seen.add(id);
          found.push(inst);
        }
      }
    }

    const mapped = found.map(inst => ({
      id: inst.id,
      display_name: inst.display_name,
      status: inst.status || 'active',
    }));
    // Sort: main institution first, then the rest alphabetically
    mapped.sort((a, b) => {
      const aIsMain = normalizeInstitutionId(a.id) === myInstitutionId.value;
      const bIsMain = normalizeInstitutionId(b.id) === myInstitutionId.value;
      if (aIsMain) return -1;
      if (bIsMain) return 1;
      return a.display_name.localeCompare(b.display_name);
    });
    institutionOptions.value = mapped;

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

<style>
/* Unscoped so it applies to the Vuetify overlay menu */
.institution-item .v-list-item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
