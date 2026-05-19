<template>
  <SettingsRow
    v-if="authorCurationEnabled"
    label="Claimed author profile"
  >
    <!-- Already claimed (approved) -->
    <AuthorProfileClaimed v-if="userAuthorId" :author-id="userAuthorId" />

    <!-- Pending claim (submitted, not yet approved): gold chip in the slot
         where the approved author name link will appear. -->
    <v-chip
      v-else-if="pendingClaim"
      color="warning"
      variant="flat"
      size="small"
      label
    >
      Claim pending
    </v-chip>

    <!-- No claim — send them to a search for their own name. -->
    <router-link
      v-else
      :to="findProfileRoute"
      class="settings-action text-decoration-none"
    >
      Find your author profile
    </router-link>
  </SettingsRow>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from './AuthorProfileClaimed.vue';

defineOptions({ name: 'AuthorProfileSection' });

const store = useStore();

const authorCurationEnabled = computed(() => !!store.getters.featureFlags?.author_curation);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const pendingClaim = computed(() => store.getters['user/pendingClaim']);
const userName = computed(() => store.state.user?.name || '');

const findProfileRoute = computed(() => ({
  name: 'Serp',
  params: { entityType: 'authors' },
  query: { filter: `default.search:${userName.value}` },
}));
</script>
