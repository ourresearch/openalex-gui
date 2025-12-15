<template>
  <div>
    <SettingsSection title="Organization">
      <template v-if="hasOrganization">
        <SettingsRow
          label="Organization"
          description="Your linked organization"
        >
          <span class="text-sm">{{ organizationName }}</span>
        </SettingsRow>

        <SettingsRow
          label="Role"
          description="Your role within the organization"
        >
          <span class="text-sm">{{ formattedRole }}</span>
        </SettingsRow>
      </template>
      <template v-else>
        <SettingsRow
          label="No organization"
          description="You're not linked to any organizational account on OpenAlex"
        >
          <span class="text-sm text-muted-foreground">—</span>
        </SettingsRow>
      </template>
    </SettingsSection>

    <SettingsSection v-if="isOrgOwner" title="Dashboard">
      <SettingsRow
        label="Organization dashboard"
        description="Manage your organization settings and members"
      >
        <Button
          variant="ghost"
          asChild
        >
          <router-link :to="`/organizations/${organizationId}`">
            View dashboard
          </router-link>
        </Button>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { Button } from '@/components/ui/button';

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
