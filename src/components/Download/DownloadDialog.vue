<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Export to CSV</CardTitle>
      <Button variant="ghost" size="icon" @click="closeDialog">
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <CardContent>
      <div v-if="isLoading" class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="!userId" class="text-center">
        <p class="mb-4">To download large datasets, please login or create an account.</p>
        <div class="flex justify-center gap-2">
          <Button @click="openLogin">Login</Button>
          <Button variant="outline" @click="openSignup">Sign Up</Button>
        </div>
      </div>

      <div v-else>
        <p v-if="!exportStarted" class="text-sm">
          Exporting {{ filters.millify(resultsCount) }} results may take up to {{ estimatedTime }}.
          You'll be notified by email when your CSV is ready to download.
        </p>
        <p v-if="exportStarted" class="text-sm">{{ exportMessage }}</p>
        
        <div v-if="!exportStarted" class="mt-6 flex justify-end gap-2">
          <Button variant="outline" @click="closeDialog">Cancel</Button>
          <Button @click="createExport">Export</Button>
        </div>
        <div v-else class="mt-3 flex justify-end">
          <Button variant="outline" @click="closeDialog">Close</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { X } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { api } from '@/api';
import filters from '@/filters';

defineOptions({ name: 'DownloadDialog' });

const props = defineProps({
  resultsCount: Number,
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const store = useStore();
const router = useRouter();

const exportStarted = ref(false);
const exportMessage = ref('');
const isLoading = ref(false);

const query = computed(() => store.getters['search/query']);
const userId = computed(() => store.getters['user/userId']);
const userEmail = computed(() => store.getters['user/userEmail']);

const estimatedTime = computed(() => {
  const count = props.resultsCount;
  if (count <= 10_000) return '5 minutes';
  if (count <= 1_000_000) return '10 minutes';
  if (count <= 10_000_000) return '20 minutes';
  if (count <= 50_000_000) return '2 hours';
  if (count <= 300_000_000) return '5 hour';
  return 'a day';
});

const closeDialog = () => emit('close');
const openLogin = () => router.push({ name: 'Login' });
const openSignup = () => router.push({ name: 'Signup' });

const resetState = () => {
  exportStarted.value = false;
  exportMessage.value = '';
};

const createExport = async () => {
  try {
    exportMessage.value = 'Processing your export request...';
    isLoading.value = true;
    exportStarted.value = true;
    await api.createExport(query.value, userEmail.value);
    isLoading.value = false;
    exportMessage.value = 'Your export has been initiated. You will receive an email when it is ready to download.';
  } catch (error) {
    console.error('Export failed:', error);
    exportMessage.value = 'An error occurred while processing your request. Please try again.';
  }
};

watch(() => props.isOpen, (newVal) => {
  if (!newVal) { resetState(); }
});
</script>


<style scoped>
/* Minimal scoped styles */
</style>