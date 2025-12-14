<template>
  <SettingsSection title="Organization">
    <!-- Organization -->
    <SettingsRow
      label="Organization"
      description="The organization this user belongs to"
    >
      <div class="d-flex align-center ga-2" style="min-width: 300px;">
        <v-autocomplete
          v-model="selectedOrg"
          :items="orgItems"
          :loading="orgSearchLoading || saving"
          :disabled="saving"
          item-title="name"
          item-value="id"
          return-object
          placeholder="Search organizations..."
          density="compact"
          variant="outlined"
          hide-details
          no-filter
          clearable
          style="min-width: 220px;"
          @update:search="onOrgSearch"
          @update:model-value="onOrgSelect"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-if="item.raw.domains && item.raw.domains.length" #subtitle>
                {{ item.raw.domains.join(', ') }}
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
        <router-link v-if="user.organization_id" :to="`/admin/organizations/${user.organization_id}`">
          <v-btn icon size="small" variant="text">
            <v-icon size="small">mdi-open-in-new</v-icon>
          </v-btn>
        </router-link>
      </div>
    </SettingsRow>

    <!-- Organization Role -->
    <SettingsRow
      v-if="user.organization_id"
      label="Role"
      description="User's role within the organization"
    >
      <v-select
        v-model="selectedRole"
        :items="roleItems"
        :loading="savingRole"
        :disabled="savingRole"
        density="compact"
        variant="outlined"
        hide-details
        style="min-width: 150px;"
        @update:model-value="onRoleChange"
      />
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updated']);

const store = useStore();

const saving = ref(false);
const savingRole = ref(false);
const orgSearchResults = ref([]);
const orgSearchLoading = ref(false);
const selectedOrg = ref(null);
const selectedRole = ref(null);
let orgSearchTimer = null;

const roleItems = [
  { title: 'Member', value: 'member' },
  { title: 'Owner', value: 'owner' }
];

const orgItems = computed(() => {
  const items = orgSearchResults.value.map(org => ({
    id: org.id,
    name: org.name,
    domains: org.domains
  }));
  
  // If user has an org and it's not in search results, add it
  if (props.user?.organization_id && props.user?.organization_name) {
    const currentOrg = {
      id: props.user.organization_id,
      name: props.user.organization_name,
      domains: props.user.organization_domains || []
    };
    if (!items.find(i => i.id === currentOrg.id)) {
      items.unshift(currentOrg);
    }
  }
  
  return items;
});

// Sync selectedOrg with user data
watch(() => props.user?.organization_id, () => {
  if (props.user?.organization_id && props.user?.organization_name) {
    selectedOrg.value = {
      id: props.user.organization_id,
      name: props.user.organization_name,
      domains: props.user.organization_domains || []
    };
  } else {
    selectedOrg.value = null;
  }
}, { immediate: true });

// Sync selectedRole with user data
watch(() => props.user?.organization_role, (newVal) => {
  selectedRole.value = newVal || 'member';
}, { immediate: true });

function onOrgSearch(val) {
  clearTimeout(orgSearchTimer);
  
  if (!val || !val.trim()) {
    orgSearchResults.value = [];
    orgSearchLoading.value = false;
    return;
  }
  
  orgSearchLoading.value = true;
  
  orgSearchTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      orgSearchResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      orgSearchResults.value = [];
    } finally {
      orgSearchLoading.value = false;
    }
  }, 300);
}

async function onOrgSelect(org) {
  const newOrgId = org?.id || null;
  const currentOrgId = props.user?.organization_id || null;
  
  if (newOrgId === currentOrgId) return;
  
  saving.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${props.user.id}`,
      { organization_id: newOrgId },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', newOrgId ? 'Organization updated' : 'Organization removed');
    emit('updated');
  } catch (e) {
    console.error('Failed to update organization:', e);
    store.commit('snackbar', 'Failed to update organization');
    // Revert selection
    if (props.user?.organization_id && props.user?.organization_name) {
      selectedOrg.value = {
        id: props.user.organization_id,
        name: props.user.organization_name,
        domains: props.user.organization_domains || []
      };
    } else {
      selectedOrg.value = null;
    }
  } finally {
    saving.value = false;
  }
}

async function onRoleChange(newRole) {
  if (newRole === props.user?.organization_role) return;
  
  savingRole.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${props.user.id}`,
      { organization_role: newRole },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Role updated');
    emit('updated');
  } catch (e) {
    console.error('Failed to update role:', e);
    store.commit('snackbar', 'Failed to update role');
    selectedRole.value = props.user?.organization_role || 'member';
  } finally {
    savingRole.value = false;
  }
}
</script>
