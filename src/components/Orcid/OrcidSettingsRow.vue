<template>
  <SettingsRow
    :label="words.label"
    :description="linkedOrcid ? words.linked : words.notLinked"
  >
    <!-- Not linked: one button to orcid.org and back -->
    <v-btn
      v-if="!linkedOrcid"
      :href="linkUrl"
      variant="outlined"
      rounded
      size="small"
      class="orcid-link-btn"
    >
      <OrcidIcon :size="16" class="mr-2" />
      {{ words.linkButton }}
    </v-btn>

    <!-- Unlink asks first, in the row (no browser dialog) -->
    <div v-else-if="confirmingUnlink" class="orcid-confirm text-body-2">
      <span>
        {{ words.unlinkConfirm }}
        <template v-if="hasClaimedProfile">{{ words.unlinkKeepsProfile }}</template>
      </span>
      <v-btn
        size="small"
        variant="text"
        class="settings-action"
        :disabled="busy"
        @click="confirmingUnlink = false"
      >
        {{ words.unlinkNo }}
      </v-btn>
      <v-btn
        size="small"
        variant="flat"
        rounded
        color="error"
        :loading="busy"
        @click="unlink"
      >
        {{ words.unlinkYes }}
      </v-btn>
    </div>

    <!-- Linked: the iD as an orcid.org link, "Linked", and Unlink -->
    <div v-else class="orcid-linked">
      <a
        :href="`https://orcid.org/${linkedOrcid}`"
        target="_blank"
        rel="noopener"
        class="orcid-id"
      >
        <OrcidIcon :size="16" class="mr-1" />https://orcid.org/{{ linkedOrcid }}
      </a>
      <v-chip size="small" color="success" variant="tonal" label prepend-icon="mdi-check">
        {{ words.linkedChip }}
      </v-chip>
      <v-btn
        size="small"
        variant="text"
        class="settings-action"
        @click="confirmingUnlink = true"
      >
        {{ words.unlinkButton }}
      </v-btn>
    </div>
  </SettingsRow>
</template>

<script setup>
// Settings → Profile: link your ORCID, see that it's linked, unlink it (oxjob #1475).
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import OrcidIcon from './OrcidIcon.vue';
import { copy, bareOrcid, orcidAuthorizeUrl, ORCID_STATE_SETTINGS } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'OrcidSettingsRow' });

const store = useStore();
const words = copy.orcidSettings;

const linkedOrcid = computed(() => bareOrcid(store.getters['user/verifiedOrcid']));
const hasClaimedProfile = computed(() => !!store.getters['user/userAuthorId']);
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
.orcid-linked,
.orcid-confirm {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.orcid-id {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #1A1A1A;
  text-decoration: none;
}
.orcid-id:hover {
  text-decoration: underline;
}
.orcid-link-btn {
  text-transform: none;
  letter-spacing: normal;
}
</style>
