<template>
  <SettingsRow :label="words.label" :description="linkedOrcid ? '' : words.notLinked">
    <!-- Linked: the description is the iD itself -->
    <template v-if="linkedOrcid" #description>
      <OrcidIdLink :orcid="linkedOrcid" />
    </template>

    <!-- Not linked: one button to orcid.org and back -->
    <v-btn
      v-if="!linkedOrcid"
      :href="linkUrl"
      variant="outlined"
      rounded
      size="small"
      class="orcid-btn"
    >
      <OrcidIcon :size="16" class="mr-2" />
      {{ words.linkButton }}
    </v-btn>

    <!-- Unlink asks first, in the row (no browser dialog) -->
    <div v-else-if="confirmingUnlink" class="orcid-confirm text-body-2">
      <span>{{ words.unlinkConfirm }}</span>
      <v-btn
        size="small"
        variant="text"
        class="settings-action"
        :disabled="busy"
        @click="confirmingUnlink = false"
      >
        {{ copy.profileSettings.cancel }}
      </v-btn>
      <v-btn
        size="small"
        variant="flat"
        rounded
        color="error"
        :loading="busy"
        @click="unlink"
      >
        {{ words.unlinkButton }}
      </v-btn>
    </div>

    <v-btn
      v-else
      variant="outlined"
      rounded
      size="small"
      class="orcid-btn"
      @click="confirmingUnlink = true"
    >
      {{ words.unlinkButton }}
    </v-btn>
  </SettingsRow>
</template>

<script setup>
// Settings → Profile: link your ORCID, see the linked iD, unlink it (oxjob #1475).
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import OrcidIcon from './OrcidIcon.vue';
import OrcidIdLink from './OrcidIdLink.vue';
import { copy, orcidAuthorizeUrl, ORCID_STATE_SETTINGS } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'OrcidSettingsRow' });

const store = useStore();
const words = copy.orcidSettings;

const linkedOrcid = computed(() => store.getters['user/verifiedOrcid']);
const linkUrl = computed(() => orcidAuthorizeUrl({
  origin: window.location.origin,
  state: ORCID_STATE_SETTINGS,
}));

const confirmingUnlink = ref(false);
const busy = ref(false);

async function unlink() {
  busy.value = true;
  try {
    await store.dispatch('user/unlinkOrcid');
    store.commit('snackbar', words.unlinked);
  } catch (e) {
    store.commit('snackbar', { msg: 'Could not unlink your ORCID. Please try again.', color: 'error' });
  } finally {
    busy.value = false;
    confirmingUnlink.value = false;
  }
}
</script>

<style scoped>
.orcid-confirm {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.orcid-btn {
  text-transform: none;
  letter-spacing: normal;
}
</style>
