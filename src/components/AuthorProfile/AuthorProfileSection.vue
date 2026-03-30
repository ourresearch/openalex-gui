<template>
  <SettingsSection v-if="authorCurationEnabled" title="OpenAlex Author Profile">
    <!-- Already claimed -->
    <div v-if="userAuthorId" class="pa-4">
      <AuthorProfileClaimed :author-id="userAuthorId" />
    </div>

    <!-- Not yet claimed -->
    <SettingsRow
      v-else
      label="Claim your profile"
      description="Link your OpenAlex author profile to your account"
    >
      <v-btn
        variant="text"
        class="settings-action"
        @click="isSearchDialogOpen = true"
      >
        Search profiles
      </v-btn>
    </SettingsRow>

    <!-- Search dialog -->
    <v-dialog v-model="isSearchDialogOpen" max-width="640" scrollable>
      <v-card rounded>
        <v-card-title class="d-flex align-center justify-space-between">
          Claim your author profile
          <v-btn icon variant="text" size="small" @click="isSearchDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-0">
          <AuthorProfileSearch @claimed="handleClaim" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </SettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from './AuthorProfileClaimed.vue';
import AuthorProfileSearch from './AuthorProfileSearch.vue';

defineOptions({ name: 'AuthorProfileSection' });

const store = useStore();

const authorCurationEnabled = computed(() => !!store.getters.featureFlags?.author_curation);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const isSearchDialogOpen = ref(false);

async function handleClaim(authorId) {
  try {
    const shortId = authorId.replace('https://openalex.org/authors/', '')
                            .replace('https://openalex.org/', '');
    await store.dispatch('user/setAuthorId', shortId);
    isSearchDialogOpen.value = false;
    store.commit('snackbar', 'Author profile claimed!');
  } catch (err) {
    console.error('Failed to claim profile:', err);
    store.commit('snackbar', 'Failed to claim profile. Please try again.');
  }
}
</script>
