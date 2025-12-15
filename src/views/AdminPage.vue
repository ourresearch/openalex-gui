<template>
  <div class="container mx-auto px-4">
    <div class="flex justify-center">
      <div class="w-full max-w-4xl">
        <div v-if="isAdmin" class="p-8">
          <h1 class="text-2xl font-bold mb-2">Hello Admin</h1>
          <div class="relative max-w-[600px]">
            <Input
              v-model="searchQuery"
              placeholder="Search for users by name or email"
              class="pr-10"
              @keyup.enter="searchUsers"
            />
            <Button
              variant="ghost"
              size="icon"
              class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              @click="searchQuery ? clearResults() : searchUsers()"
            >
              <X v-if="searchQuery" class="h-4 w-4" />
              <Search v-else class="h-4 w-4" />
            </Button>
          </div>
          <Alert v-if="error" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
          <div v-if="loading" class="mt-4 h-1 bg-primary/20 rounded overflow-hidden">
            <div class="h-full bg-primary animate-pulse w-full"></div>
          </div>
          <div v-if="users.length" class="mt-4">
            <div class="flex justify-end items-center mb-2">
              <span class="text-sm text-muted-foreground">{{ users.length }} result{{ users.length === 1 ? '' : 's' }}</span>
            </div>
            <div class="space-y-2">
              <Card
                v-for="user in users"
                :key="user.id"
              >
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium">
                        <span class="mr-2">{{ user.name }}</span>
                        <span v-if="user.email" class="text-muted-foreground">{{ user.email }}</span>
                      </div>
                      <div class="text-xs text-muted-foreground mt-1">ID: {{ user.id }}</div>
                      <div v-if="user.author_id" class="text-xs text-muted-foreground">Author ID: {{ user.author_id }}</div>
                    </div>
                    <div class="flex flex-col items-end min-w-[220px]">
                      <div class="flex items-start gap-2">
                        <div v-for="flag in booleanFlags" :key="flag.key" class="flex items-center gap-1">
                          <Checkbox
                            :id="`${user.id}-${flag.key}`"
                            :checked="editedUsers[user.id]?.[flag.key] !== undefined ? editedUsers[user.id][flag.key] : user[flag.key]"
                            @update:checked="val => onFlagChange(user, flag.key, val)"
                          />
                          <Label :for="`${user.id}-${flag.key}`" class="text-xs">{{ flag.label }}</Label>
                        </div>
                      </div>
                      <div class="mt-2 w-full text-right">
                        <Button
                          v-if="hasUserEdits(user.id)"
                          size="sm"
                          @click="saveUser(user)"
                          :disabled="savingUserId === user.id"
                        >
                          {{ savingUserId === user.id ? 'Saving...' : 'Save' }}
                        </Button>
                        <span
                          v-else-if="savedUsers[user.id]"
                          class="text-green-600 text-sm"
                        >Saved</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div v-else-if="searched" class="mt-4 text-muted-foreground">No users found.</div>
        </div>

        <div v-else class="text-center py-8">
          <h3 class="text-lg font-medium">You must be an admin to view this page</h3>
        </div>

      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Search, X, AlertCircle } from 'lucide-vue-next';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
      `${urlBase.userApi}/admin/users/${user.id}`,
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
/* Styles handled via Tailwind classes */
</style>
