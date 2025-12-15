<template>
  <div>
    <div class="flex items-center mb-6">
      <h1 class="text-xl font-bold">Exports</h1>
      <div class="flex-1"></div>
      <Button
        v-if="exports.length"
        variant="ghost"
        size="sm"
        class="text-destructive"
        @click="deleteAllExports"
      >
        <Trash2 class="h-4 w-4 mr-1" />
        Delete all
      </Button>
    </div>

    <Card class="bg-white">
      <CardContent v-if="isLoading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div class="mt-4 text-muted-foreground">Loading your exports...</div>
      </CardContent>

      <CardContent v-else-if="error" class="py-8">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </CardContent>

      <CardContent v-else-if="!exports.length" class="py-8 text-center text-muted-foreground">
        You haven't created any exports yet.
      </CardContent>

      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Format</TableHead>
            <TableHead>Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="exp in exports" :key="exp.id">
            <TableCell>
              <div class="flex items-center gap-2">
                <FileText class="h-4 w-4 text-muted-foreground" />
                {{ exp.format?.toUpperCase() || 'CSV' }}
              </div>
            </TableCell>
            <TableCell>
              <Tooltip>
                <TooltipTrigger>
                  <span class="cursor-pointer">
                    {{ formatRelativeTime(exp.created || exp.submitted) }}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{{ formatExactDate(exp.created || exp.submitted) }}</TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <!-- Show percent complete for in-progress exports -->
                <Tooltip v-if="!isExportComplete(exp)">
                  <TooltipTrigger>
                    <span class="text-sm text-muted-foreground mr-2">
                      {{ formatProgress(exp.progress) }}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{{ formatProgress(exp.progress) }}% completed</TooltipContent>
                </Tooltip>

                <!-- Download button for completed exports -->
                <Tooltip v-if="isExportComplete(exp) && exp.result_url">
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a :href="exp.result_url" target="_blank">
                        <Download class="h-4 w-4 text-primary" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>

                <!-- More actions menu -->
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <router-link :to="getSearchRoute(exp)" class="flex items-center gap-2">
                        <Search class="h-4 w-4" />
                        Rerun search
                      </router-link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive"
                      @click="deleteExport(exp.id)"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { format as formatTimeago } from 'timeago.js';

import { Trash2, FileText, Download, MoreVertical, Search, AlertCircle } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'MeExports' });

useHead({ title: 'Exports' });

const store = useStore();

const exports = ref([]);
const isLoading = ref(false);
const error = ref(null);
const now = ref(Date.now());

const userId = computed(() => store.getters['user/userId']);

// Update relative times every minute
let timeUpdateInterval;
onMounted(() => {
  fetchExports();
  timeUpdateInterval = setInterval(() => {
    now.value = Date.now();
  }, 60000);
});

onBeforeUnmount(() => {
  clearInterval(timeUpdateInterval);
  clearInterval(pollInterval);
});

// Poll for updates on in-progress exports
let pollInterval;
onMounted(() => {
  pollInterval = setInterval(() => {
    const hasInProgress = exports.value.some(exp => !isExportComplete(exp));
    if (hasInProgress) {
      fetchExports();
    }
  }, 3000);
});

const fetchExports = async () => {
  if (!userId.value) {
    error.value = 'You must be logged in to view your exports.';
    return;
  }

  if (!isLoading.value) {
    isLoading.value = exports.value.length === 0;
  }
  error.value = null;

  try {
    const response = await axios.get(
      `${urlBase.userApi}/users/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = response.data.exports || response.data || [];
  } catch (err) {
    console.error('Error fetching exports:', err);
    error.value = 'Unable to load your exports. Please try again later.';
    exports.value = [];
  } finally {
    isLoading.value = false;
  }
};

const isExportComplete = (exp) => {
  return exp.status === 'finished' || exp.status === 'completed';
};

const formatProgress = (progress) => {
  if (progress === null || progress === undefined) return 0;
  return Math.round(progress * 100);
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  // If the date string doesn't have timezone info, assume UTC
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  // Access now.value to create reactivity dependency
  // eslint-disable-next-line no-unused-vars
  const _ = now.value;
  return formatTimeago(parseDate(dateString));
};

const formatExactDate = (dateString) => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
};

const getSearchRoute = (exp) => {
  // Extract filter from query_url (e.g., "https://api.openalex.org/works?filter=...")
  if (exp.query_url) {
    try {
      const url = new URL(exp.query_url);
      const filter = url.searchParams.get('filter');
      if (filter) {
        return {
          name: 'Serp',
          params: { entityType: 'works' },
          query: { filter },
        };
      }
    } catch (e) {
      console.error('Failed to parse query_url:', e);
    }
  }
  return {
    name: 'Serp',
    params: { entityType: 'works' },
  };
};

const deleteExport = async (exportId) => {
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${userId.value}/exports/${exportId}`,
      axiosConfig({ userAuth: true })
    );
    exports.value = exports.value.filter(exp => exp.id !== exportId);
    store.commit('snackbar', 'Export deleted');
  } catch (err) {
    console.error('Error deleting export:', err);
    store.commit('snackbar', 'Failed to delete export');
  }
};

const deleteAllExports = async () => {
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = [];
    store.commit('snackbar', 'All exports deleted');
  } catch (err) {
    console.error('Error deleting exports:', err);
    store.commit('snackbar', 'Failed to delete exports');
  }
};
</script>
