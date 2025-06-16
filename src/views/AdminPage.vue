<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="10" lg="8">
        <div v-if="isAdmin" class="pa-8">
          <h1 class="mb-2">Hello Admin</h1>
          <v-text-field
            v-model="searchQuery"
            variant="outlined"
            label="Search for users by name or email"
            @keyup.enter="searchUsers"
            append-icon="mdi-magnify"
            @click:append="searchUsers"
            class=""
            style="max-width: 600px;"
            clearable
            hide-details
            @click:clear="clearResults"
          />
          <v-alert v-if="error" type="error" density="compact">{{ error }}</v-alert>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mt-4"/>
          <div v-if="users.length" class="mt-1">
            <div class="d-flex justify-end align-center mb-0">
              <span class="mb-1 mr-2 text-grey-darken-1" style="font-size: 13px;">{{ users.length }} result{{ users.length === 1 ? '' : 's' }}</span>
            </div>
            <v-list lines="two" class="pa-0" style="background: transparent;">
              <v-list-item
                v-for="user in users"
                :key="user.id"
                class="mb-2"
                style="border:1px solid #eee;border-radius:8px;background:white;"
              >                
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <v-list-item-title>
                      <b class="mr-2">{{ user.name }}</b>
                      <span v-if="user.email" class="text-grey">{{ user.email }}</span>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <div style="font-size: 11px;" class="mt-1">ID: {{ user.id }}</div>
                      <div v-if="user.author_id">Author ID: {{ user.author_id }}</div>
                    </v-list-item-subtitle>
                  </div>
                  <div class="d-flex flex-column align-end" style="min-width: 220px;">
                    <div class="d-flex align-start" style="gap: 4px;">
                      <v-checkbox
                        v-for="flag in booleanFlags"
                        :key="flag.key"
                        :label="flag.label"
                        :model-value="editedUsers[user.id]?.[flag.key] !== undefined ? editedUsers[user.id][flag.key] : user[flag.key]"
                        @update:model-value="val => onFlagChange(user, flag.key, val)"
                        hide-details
                        class="admin-checkbox mr-1 py-0"
                        density="compact"
                        size="small"
                      />
                    </div>
                    <div class="mt-1" style="width: 100%;">
                      <v-btn
                        v-if="hasUserEdits(user.id)"
                        color="primary"
                        size="small"
                        block
                        @click="saveUser(user)"
                        :loading="savingUserId === user.id"
                        class="float-right"
                      >Save</v-btn>
                      <span
                        v-else-if="savedUsers[user.id]"
                        class="text-green-darken-2 float-right"
                        style="font-size:13px;"
                      >Saved</span>
                    </div>
                  </div>
                </div>
                
              </v-list-item>
            </v-list>
          </div>
          <div v-else-if="searched">No users found.</div>
        </div>

        <div v-else class="text-center">
          <h3>You must be an admin to view this page</h3>
        </div>

      </v-col>
    </v-row>
  </v-container>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

const store = useStore();
const isAdmin = computed(() => store.state.user.isAdmin);

// Reactive state
const searchQuery = ref('');
const users = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const editedUsers = ref({});
const savingUserId = ref(null);
const savedUsers = ref({});

const booleanFlags = [
  { key: 'is_admin', label: 'Admin' },
  { key: 'is_tester', label: 'Tester' },
  { key: 'is_librarian', label: 'Librarian' },
];

// Search function
async function searchUsers() {
  const trimmedQuery = searchQuery.value.trim();
  if (!trimmedQuery || trimmedQuery.length < 3) {
    error.value = 'Please enter at least 3 characters to search.';
    return;
  }

  error.value = '';
  loading.value = true;
  searched.value = false;
  users.value = [];

  try {
    const res = await axios.get(
      `${urlBase.userApi}/admin/users?q=${encodeURIComponent(trimmedQuery)}`,
      axiosConfig({ userAuth: true })
    );
    users.value = res.data;
    searched.value = true;
    editedUsers.value = {};
  } catch (e) {
    error.value = e?.response?.data?.message || 'Search failed.';
  } finally {
    loading.value = false;
  }
}

function clearResults() {
  users.value = [];
  searched.value = false;
  editedUsers.value = {};
  error.value = '';
}

function onFlagChange(user, key, val) {
  const userEdits = editedUsers.value[user.id] || {};
  const updatedUserEdits = { ...userEdits, [key]: val };
  editedUsers.value = {
    ...editedUsers.value,
    [user.id]: updatedUserEdits,
  };

  // If all flags match original user, clear edits
  const orig = users.value.find(u => u.id === user.id);
  const allMatch = booleanFlags.every(f =>
    (updatedUserEdits[f.key] === undefined ? orig[f.key] : updatedUserEdits[f.key]) === orig[f.key]
  );

  if (allMatch) {
    const { [user.id]: _, ...rest } = editedUsers.value;
    editedUsers.value = rest;
  }
}

function hasUserEdits(userId) {
  return editedUsers.value[userId] && Object.keys(editedUsers.value[userId]).length > 0;
}

async function saveUser(user) {
  savingUserId.value = user.id;
  error.value = '';

  try {
    await axios.post(
      `${urlBase.userApi}/admin/user/${user.id}`,
      editedUsers.value[user.id],
      axiosConfig({ userAuth: true })
    );

    const idx = users.value.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users.value[idx] = {
        ...users.value[idx],
        ...editedUsers.value[user.id],
      };
    }

    editedUsers.value[user.id] = {};
    savedUsers.value[user.id] = true;

    setTimeout(() => {
      savedUsers.value[user.id] = false;
    }, 2000);

    savingUserId.value = null;
  } catch (err) {
    error.value = err.response?.data?.msg || 'Failed to save changes.';
    savingUserId.value = null;
  }
}
</script>


<style scoped>
.admin-checkbox .v-label {
  font-size: 11px !important;
  margin-left: 2px !important;
}
.admin-checkbox .v-input--selection-controls__input {
  margin-right: 2px !important;
}
.admin-checkbox {
  min-width: 70px !important;
  font-size: 11px !important;
  height: 24px !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
</style>
