<template>
  <div>
    <SettingsSection title="Organization">
      <template v-if="hasOrganization">
        <SettingsRow
          label="Organization"
          description="Your linked organization"
        >
          <span class="text-body-2">{{ organizationName }}</span>
        </SettingsRow>

        <SettingsRow
          label="Role"
          description="Your role within the organization"
        >
          <span class="text-body-2">{{ formattedRole }}</span>
        </SettingsRow>
      </template>
      <template v-else>
        <SettingsRow
          label="No organization"
          description="You're not linked to any organizational account on OpenAlex"
        >
          <span class="text-body-2 text-medium-emphasis">—</span>
        </SettingsRow>
      </template>
    </SettingsSection>

    <SettingsSection v-if="isOrgOwner" title="Dashboard">
      <SettingsRow
        label="Organization dashboard"
        description="Manage your organization settings and members"
      >
        <v-btn
          variant="text"
          class="settings-action"
          :to="`/organizations/${organizationId}`"
        >
          View dashboard
        </v-btn>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'MeOrganization' });

useHead({ title: 'Organization' });

const store = useStore();

const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);

const hasOrganization = computed(() => !!organizationId.value);
const isOrgOwner = computed(() => organizationRole.value === 'owner');

const formattedRole = computed(() => {
  if (!organizationRole.value) return 'Not set';
  return organizationRole.value.charAt(0).toUpperCase() + organizationRole.value.slice(1);
});
</script>
