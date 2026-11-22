<template>
  <SettingsRow :label="words.label" :description="linkedOrcid ? '' : words.notLinked">
    <!-- Linked: the description is the iD itself -->
    <template v-if="linkedOrcid" #description>
      <OrcidIdLink :orcid="linkedOrcid" />
      <div v-if="canLogIn" class="text-medium-emphasis">{{ words.canLogIn }}</div>
    </template>

    <!-- Not linked: one button to orcid.org and back. Linked: "✓ Linked" and a
         ⋮ menu (Copy iD, Open on ORCID, Unlink). -->
    <SettingsValueActions
      :is-set="!!linkedOrcid"
      :label="words.label"
      :badge="words.linkedBadge"
      :value="`https://orcid.org/${linkedOrcid}`"
      :copy-label="words.copy"
      :open-label="words.open"
      :open-href="`https://orcid.org/${linkedOrcid}`"
      :remove-label="words.unlinkButton"
      :confirm-title="words.unlinkConfirm"
      :confirm-body="words.unlinkBody"
      :busy="busy"
      @remove="unlink"
    >
      <v-btn variant="outlined" @click="startOrcidTrip({ flow: 'settings', userId: store.getters['user/userId'] })" rounded size="small" block>
        <OrcidIcon :size="16" class="mr-2" />
        {{ words.linkButton }}
      </v-btn>
    </SettingsValueActions>
  </SettingsRow>
</template>

<script setup>
// Settings → Profile: link your ORCID, see the linked iD, unlink it (oxjob #1475).
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import SettingsValueActions from '@/components/Settings/SettingsValueActions.vue';
import OrcidIcon from './OrcidIcon.vue';
import OrcidIdLink from './OrcidIdLink.vue';
import { copy } from '@/components/Entity/claimCopy.js';
import { startOrcidTrip } from './orcidAuth.js';

defineOptions({ name: 'OrcidSettingsRow' });

const store = useStore();
const words = copy.orcidSettings;

const linkedOrcid = computed(() => store.getters['user/verifiedOrcid']);
const canLogIn = computed(() => store.getters['user/canLogInWithOrcid']);

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
  }
}
</script>
