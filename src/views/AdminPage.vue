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
                          :value="editedUsers[user.id]?.[flag.key] ?? user[flag.key]"
                          :model-value="editedUsers[user.id]?.[flag.key] ?? user[flag.key]"
                          @update:model-value="val => onFlagChange(user, flag.key, val)"
                          hide-details
                          class="admin-checkbox mr-1 py-0"
                          dense
                          small
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


<script>
import axios from 'axios';
import {mapState } from 'vuex';
import {urlBase, axiosConfig } from '@/apiConfig';

export default {
  name: 'AdminPage',
  data() {
    return {
      searchQuery: '',
      users: [],
      error: '',
      loading: false,
      searched: false,
      editedUsers: {}, // { [userId]: {flag: value, ...} }
      savingUserId: null,
      savedUsers: {}, // { [userId]: true }
      booleanFlags: [
        { key: 'is_admin', label: 'Admin' },
        { key: 'is_tester', label: 'Tester' },
        { key: 'is_librarian', label: 'Librarian' },
      ]
    }
  },
  computed: {
    ...mapState('user', ['isAdmin'])
  },
  methods: {
    async searchUsers() {
      if (!this.searchQuery.trim() || this.searchQuery.trim().length < 3) {
        this.error = 'Please enter at least 3 characters to search.';
        return;
      }
      this.error = '';
      this.loading = true;
      this.searched = false;
      this.users = [];
      try {
        const res = await axios.get(
          `${urlBase.userApi}/admin/users?q=${encodeURIComponent(this.searchQuery)}`,
          axiosConfig({ userAuth: true })
        );
        this.users = res.data;
        this.searched = true;
        this.editedUsers = {};
      } catch (e) {
        this.error = e?.response?.data?.message || 'Search failed.';
      } finally {
        this.loading = false;
      }
    },
    clearResults() {
      this.users = [];
      this.searched = false;
      this.editedUsers = {};
      this.error = '';
    },
    onFlagChange(user, key, val) {
      const userEdits = this.editedUsers[user.id] || {};
      const updatedUserEdits = { ...userEdits, [key]: val };
      this.editedUsers = {
        ...this.editedUsers,
        [user.id]: updatedUserEdits
      };
      
      // If all flags match original user, clear edits
      const orig = this.users.find(u => u.id === user.id);
      const allMatch = this.booleanFlags.every(f => 
        (updatedUserEdits[f.key] === undefined ? orig[f.key] : updatedUserEdits[f.key]) === orig[f.key]
      );
      
      if (allMatch) {
        // Create a new object without this user's edits
        const { [user.id]: _, ...restEdits } = this.editedUsers;
        this.editedUsers = restEdits;
      }
    },
    hasUserEdits(userId) {
      return this.editedUsers[userId] && Object.keys(this.editedUsers[userId]).length > 0;
    },
    async saveUser(user) {
      this.savingUserId = user.id;
      this.error = '';
      try {
        const res = await axios.post(
          `${urlBase.userApi}/admin/user/${user.id}`,
          this.editedUsers[user.id],
          axiosConfig({ userAuth: true })
        );
        const updated = res.data;
        // Update user in users array
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          this.users[idx] = { ...this.users[idx], ...this.editedUsers[user.id] };
        }
        this.editedUsers = {
          ...this.editedUsers,
          [user.id]: {}
        };
        this.savedUsers = {
          ...this.savedUsers,
          [user.id]: true
        };
        setTimeout(() => {
          this.savedUsers = {
            ...this.savedUsers,
            [user.id]: false
          };
        }, 2000);
        this.savingUserId = null;
      } catch (err) {
        this.error = err.response?.data?.msg || 'Failed to save changes.';
        this.savingUserId = null;
      }
    },
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
