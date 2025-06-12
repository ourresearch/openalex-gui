<template>
  <v-card>
    <!-- Dialog Header -->
    <v-toolbar flat>
      <v-toolbar-title>Export to CSV</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Dialog Body -->
    <v-card-text class="text-body-1" :loading="isLoading">
      <div v-if="!userId" class="text-center">
        <p>To download large datasets, please login or create an account.</p>
        <v-btn color="primary" class="mr-2" @click="openLogin">Login</v-btn>
        <v-btn color="secondary" @click="openSignup">Sign Up</v-btn>
      </div>

      <div v-else>
        <p v-if="!exportStarted">
          Exporting {{ filters.millify(resultsCount) }} results may take up to {{ estimatedTime }}.
          You’ll be notified by email when your CSV is ready to download.
        </p>
        <p v-if="exportStarted">{{ exportMessage }}</p>
        
        <div v-if="!exportStarted" class="mt-6 text-right">
          <v-btn color="primary" @click="createExport">Export</v-btn>
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        </div>
        <div v-else class="mt-3 text-right">
          <v-btn variant="text" @click="closeDialog">Close</v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
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
const openLogin = () => store.commit('user/setIsLoginDialogOpen', true);
const openSignup = () => store.commit('user/setIsSignupDialogOpen', true);

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
.text-center {
  text-align: center;
}
</style>