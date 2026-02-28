<template>
  <v-container class="page" style="max-width: 700px;">
    <div class="d-flex align-center mb-1">
      <router-link to="/repositories" class="text-body-2 text-medium-emphasis mr-2">
        Repositories
      </router-link>
      <span class="text-medium-emphasis">/</span>
    </div>

    <div class="text-h4 font-weight-bold mb-2 mt-4">Add Your Repository</div>
    <div class="text-body-1 text-medium-emphasis mb-6">
      Submit your OAI-PMH repository to be harvested by OpenAlex.
    </div>

    <!-- Success state -->
    <v-alert v-if="submitted" type="success" variant="tonal" class="mb-6">
      <div class="font-weight-medium mb-1">Repository request submitted</div>
      <div class="text-body-2">
        We'll review your submission and begin harvesting soon.
        You'll receive an email at <strong>{{ form.email }}</strong> when your repository is connected.
      </div>
      <v-btn
        variant="text"
        color="primary"
        size="small"
        class="mt-2"
        to="/repositories"
      >
        Back to search
      </v-btn>
    </v-alert>

    <!-- Form -->
    <v-form v-else ref="formRef" @submit.prevent="submitForm">
      <!-- Email -->
      <v-text-field
        v-model="form.email"
        label="Email address"
        type="email"
        :rules="[rules.required, rules.email]"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- OAI-PMH URL -->
      <v-text-field
        v-model="form.pmh_url"
        label="OAI-PMH endpoint URL"
        placeholder="https://example.edu/oai"
        :rules="[rules.required, rules.url]"
        variant="outlined"
        density="compact"
        class="mb-1"
      />

      <!-- Validate button -->
      <v-btn
        variant="text"
        color="primary"
        size="small"
        :loading="validating"
        :disabled="!form.pmh_url"
        class="mb-4"
        @click="validateEndpoint"
      >
        Validate endpoint
      </v-btn>

      <!-- Validation results -->
      <v-alert v-if="validationError" type="error" variant="tonal" density="compact" class="mb-4">
        {{ validationError }}
      </v-alert>

      <div v-if="validationResult" class="mb-4">
        <v-card variant="outlined">
          <v-card-text>
            <div v-if="validationResult.identify" class="d-flex align-center mb-2">
              <v-icon
                :color="validationResult.identify.status === 'success' ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ validationResult.identify.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="text-body-2">
                <strong>Identify:</strong>
                {{ validationResult.identify.status === 'success' ? 'SUCCESS' : validationResult.identify.error || 'FAILED' }}
              </span>
            </div>
            <div v-if="validationResult.query" class="d-flex align-center mb-2">
              <v-icon
                :color="validationResult.query.status === 'success' ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ validationResult.query.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
              <span class="text-body-2">
                <strong>ListRecords:</strong>
                {{ validationResult.query.status === 'success' ? 'SUCCESS' : validationResult.query.error || 'FAILED' }}
              </span>
            </div>
            <div v-if="validationResult.query?.message" class="text-body-2 text-medium-emphasis mt-1 ml-6 mb-2">
              {{ validationResult.query.message }}
            </div>
            <div v-if="validationResult.query?.sample" class="mt-2">
              <div class="text-body-2 text-medium-emphasis mb-1">Sample record:</div>
              <v-sheet color="grey-lighten-4" rounded class="pa-3 text-body-2" style="overflow-x: auto; max-height: 150px;">
                <pre style="white-space: pre-wrap; margin: 0;">{{ validationResult.query.sample }}</pre>
              </v-sheet>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Repository name -->
      <v-text-field
        v-model="form.repo_name"
        label="Repository name"
        :rules="[rules.required]"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Homepage -->
      <v-text-field
        v-model="form.homepage_url"
        label="Repository homepage URL"
        placeholder="https://example.edu/repository"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Institution -->
      <v-text-field
        v-model="form.institution_name"
        label="Institution name"
        :rules="[rules.required]"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- OAI Set -->
      <v-text-field
        v-model="form.oai_set"
        label="Preferred OAI-PMH set (optional)"
        placeholder="e.g., com_1234_5"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Metadata prefix -->
      <v-text-field
        v-model="form.metadata_prefix"
        label="Metadata prefix"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Comments -->
      <v-textarea
        v-model="form.comments"
        label="Comments (optional)"
        variant="outlined"
        density="compact"
        rows="3"
        class="mb-4"
      />

      <v-alert v-if="submitError" type="error" variant="tonal" density="compact" class="mb-4">
        {{ submitError }}
      </v-alert>

      <v-btn
        type="submit"
        color="primary"
        :loading="submitting"
        size="large"
        block
      >
        Submit repository
      </v-btn>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'RepositoryAdd' });
useHead({ title: 'Add Repository' });

const formRef = ref(null);
const submitted = ref(false);
const submitting = ref(false);
const submitError = ref(null);
const validating = ref(false);
const validationResult = ref(null);
const validationError = ref(null);

const form = reactive({
  email: '',
  pmh_url: '',
  repo_name: '',
  homepage_url: '',
  institution_name: '',
  oai_set: '',
  metadata_prefix: 'oai_dc',
  comments: '',
});

const rules = {
  required: (v) => !!v?.trim() || 'Required',
  email: (v) => /.+@.+\..+/.test(v) || 'Valid email required',
  url: (v) => {
    if (!v) return true;
    try {
      new URL(v);
      return true;
    } catch {
      return 'Valid URL required';
    }
  },
};

const validateEndpoint = async () => {
  if (!form.pmh_url) return;

  validating.value = true;
  validationResult.value = null;
  validationError.value = null;

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/repository-requests/validate`,
      { pmh_url: form.pmh_url },
      axiosConfig()
    );
    validationResult.value = resp.data;
  } catch (e) {
    validationError.value = e.response?.data?.message || 'Validation failed. Check the URL and try again.';
  } finally {
    validating.value = false;
  }
};

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  submitError.value = null;

  try {
    await axios.post(
      `${urlBase.userApi}/repository-requests`,
      form,
      axiosConfig()
    );
    submitted.value = true;
  } catch (e) {
    submitError.value = e.response?.data?.message || 'Submission failed. Please try again.';
  } finally {
    submitting.value = false;
  }
};
</script>
