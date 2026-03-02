<template>
  <v-container class="page" style="max-width: 900px;">
    <!-- Hero Section -->
    <div class="text-center mt-8 mb-8">
      <div class="text-h4 font-weight-bold mb-3">Repository Dashboard</div>
      <div class="text-body-1 text-medium-emphasis" style="max-width: 650px; margin: 0 auto;">
        OpenAlex harvests metadata from thousands of institutional and subject
        repositories worldwide using the OAI-PMH protocol. Find your repository
        below to check harvest status, coverage statistics, and endpoint health.
      </div>
    </div>

    <!-- Search + Controls -->
    <div class="d-flex align-center ga-3 mb-4 flex-wrap">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search repositories..."
        hide-details
        clearable
        style="min-width: 250px; max-width: 400px;"
        @update:model-value="debouncedSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
      </v-text-field>
      <v-spacer />
      <v-btn
        variant="outlined"
        size="small"
        :loading="csvLoading"
        @click="downloadCsv"
      >
        <v-icon start size="small">mdi-tray-arrow-down</v-icon>
        Download CSV
      </v-btn>
      <v-btn
        color="primary"
        size="small"
        to="/repositories/add"
      >
        <v-icon start size="small">mdi-plus</v-icon>
        Add repository
      </v-btn>
    </div>

    <!-- Results count -->
    <div class="text-body-2 text-medium-emphasis mb-2" v-if="!loading && totalCount > 0">
      {{ showingStart.toLocaleString() }}&ndash;{{ showingEnd.toLocaleString() }}
      of {{ totalCount.toLocaleString() }} repositories
    </div>

    <!-- Table -->
    <v-card variant="outlined" class="bg-white mb-4">
      <v-table density="comfortable">
        <thead>
          <tr>
            <th
              style="cursor: pointer;"
              @click="toggleSort('display_name')"
            >
              Repository
              <v-icon v-if="sortField === 'display_name'" size="x-small" class="ml-1">
                {{ sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
            </th>
            <th>Institution</th>
            <th
              class="text-right"
              style="cursor: pointer;"
              @click="toggleSort('works_count')"
            >
              Works
              <v-icon v-if="sortField === 'works_count'" size="x-small" class="ml-1">
                {{ sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="3" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="24" />
            </td>
          </tr>
          <tr v-else-if="repos.length === 0">
            <td colspan="3" class="text-center py-8 text-medium-emphasis">
              No repositories found.
            </td>
          </tr>
          <tr
            v-else
            v-for="repo in repos"
            :key="repo.id"
            class="repo-row"
            style="cursor: pointer;"
            @click="goToRepo(repo)"
          >
            <td>
              <div class="font-weight-medium">{{ repo.display_name }}</div>
            </td>
            <td class="text-medium-emphasis">
              {{ repo.host_organization_name || '\u2014' }}
            </td>
            <td class="text-right">{{ formatNumber(repo.works_count) }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Pagination -->
    <div class="d-flex justify-end align-center mb-8" v-if="totalPages > 1">
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="page <= 1"
        @click="goPage(page - 1)"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <span class="text-body-2 mx-2">Page {{ page }} of {{ totalPages }}</span>
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="page >= totalPages"
        @click="goPage(page + 1)"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- FAQ Section -->
    <div id="faq" class="mb-12">
      <div class="text-h5 font-weight-bold mb-4">Frequently Asked Questions</div>
      <div
        v-for="(faq, i) in faqs"
        :key="i"
      >
        <div
          class="d-flex align-center py-3"
          style="cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.08);"
          @click="openFaq = openFaq === i ? null : i"
        >
          <span class="text-body-1 font-weight-medium flex-grow-1">{{ faq.q }}</span>
          <v-icon size="small">
            {{ openFaq === i ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </div>
        <div
          v-if="openFaq === i"
          class="text-body-2 text-medium-emphasis py-3"
          v-html="faq.a"
        />
      </div>
    </div>
  </v-container>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {useHead} from '@unhead/vue';
import axios from 'axios';
import {urlBase, axiosConfig} from '@/apiConfig';

defineOptions({name: 'RepositoriesLanding'});
useHead({title: 'Repository Dashboard'});

const router = useRouter();
const repos = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const page = ref(1);
const perPage = 25;
const totalCount = ref(0);
const sortField = ref('works_count');
const sortDir = ref('desc');
const csvLoading = ref(false);
const openFaq = ref(null);

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / perPage)));
const showingStart = computed(() => totalCount.value === 0 ? 0 : (page.value - 1) * perPage + 1);
const showingEnd = computed(() => Math.min(page.value * perPage, totalCount.value));

const formatNumber = (n) => {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString();
};

const faqs = [
  {
    q: 'How does OpenAlex harvest repositories?',
    a: 'We use the <a href="https://www.openarchives.org/pmh/" target="_blank">OAI-PMH protocol</a> to harvest metadata from institutional and subject repositories. Our harvester collects new and updated records regularly. Each record is matched to works in OpenAlex using DOIs and title matching.',
  },
  {
    q: 'How do I whitelist the OpenAlex harvester?',
    a: `If your repository has firewall rules or bot protection, you may need to whitelist our harvester to ensure we can access your content.
      <br><br>
      <strong>User-Agent:</strong> <code>OpenAlex OAI-PMH harvester (mailto:team@ourresearch.org)</code>
      <br><br>
      Contact <a href="mailto:team@ourresearch.org">team@ourresearch.org</a> if you need our IP ranges.`,
  },
  {
    q: 'My repository shows fewer works than expected. Why?',
    a: 'Several factors can affect counts. Records without DOIs may not match to existing works in OpenAlex. Some records may be metadata-only without full text. And our harvester may not have reached all records yet. Check the coverage section on your repository\'s dashboard page for a detailed breakdown.',
  },
  {
    q: 'How do I add a new repository?',
    a: 'Use the <a href="/repositories/add">Add repository</a> form to submit your OAI-PMH endpoint URL. We\'ll validate the endpoint and begin harvesting within a few days.',
  },
  {
    q: 'How often does OpenAlex harvest my repository?',
    a: 'We harvest most repositories every few hours. The exact frequency may vary based on the repository\'s size and how often its records change.',
  },
];

async function fetchRepos() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      filter: 'type:repository',
      per_page: String(perPage),
      page: String(page.value),
      sort: `${sortField.value}:${sortDir.value}`,
      select: 'id,display_name,host_organization_name,works_count',
      mailto: 'ui@openalex.org',
    });
    if (searchQuery.value?.trim()) {
      params.set('search', searchQuery.value.trim());
    }
    const resp = await axios.get(
      `${urlBase.api}/sources?${params.toString()}`,
      axiosConfig()
    );
    repos.value = resp.data?.results || [];
    totalCount.value = resp.data?.meta?.count || 0;
  } catch (e) {
    console.error('Failed to fetch repositories:', e);
    repos.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

let searchTimer = null;
function debouncedSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    fetchRepos();
  }, 300);
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDir.value = field === 'works_count' ? 'desc' : 'asc';
  }
  page.value = 1;
  fetchRepos();
}

function goPage(p) {
  page.value = p;
  fetchRepos();
}

function goToRepo(repo) {
  const id = repo.id?.replace('https://openalex.org/', '') || repo.id;
  router.push(`/repositories/${id}`);
}

async function downloadCsv() {
  csvLoading.value = true;
  try {
    const allRows = [];
    let cursor = '*';
    while (cursor) {
      const params = new URLSearchParams({
        filter: 'type:repository',
        per_page: '200',
        select: 'id,display_name,host_organization_name,works_count,homepage_url',
        cursor,
        mailto: 'ui@openalex.org',
      });
      const resp = await axios.get(
        `${urlBase.api}/sources?${params.toString()}`,
        axiosConfig()
      );
      const results = resp.data?.results || [];
      if (results.length === 0) break;
      allRows.push(...results);
      cursor = resp.data?.meta?.next_cursor || null;
    }

    const header = 'openalex_id,display_name,host_organization,works_count,homepage_url';
    const csvRows = allRows.map(r => {
      const id = r.id || '';
      const name = (r.display_name || '').replace(/"/g, '""');
      const org = (r.host_organization_name || '').replace(/"/g, '""');
      const works = r.works_count ?? 0;
      const url = (r.homepage_url || '').replace(/"/g, '""');
      return `"${id}","${name}","${org}",${works},"${url}"`;
    });
    const csvContent = [header, ...csvRows].join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'openalex-repositories.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (e) {
    console.error('CSV download failed:', e);
  } finally {
    csvLoading.value = false;
  }
}

onMounted(() => {
  fetchRepos();
});
</script>

<style scoped>
.repo-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
