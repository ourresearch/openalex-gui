<template>
  <SettingsSection title="Organization">
    <!-- Organization -->
    <SettingsRow
      label="Organization"
      description="The organization this user belongs to"
    >
      <div class="flex items-center gap-2 min-w-[300px]">
        <Popover v-model:open="orgPopoverOpen">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              class="w-[220px] justify-between"
              :disabled="saving"
            >
              {{ selectedOrg?.name || 'Search organizations...' }}
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search organizations..." @update:model-value="onOrgSearch" />
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  v-for="org in orgItems"
                  :key="org.id"
                  :value="org.id"
                  @select="() => { onOrgSelect(org); orgPopoverOpen = false; }"
                >
                  <Check :class="['mr-2 h-4 w-4', selectedOrg?.id === org.id ? 'opacity-100' : 'opacity-0']" />
                  <div>
                    <div>{{ org.name }}</div>
                    <div v-if="org.domains?.length" class="text-xs text-muted-foreground">
                      {{ org.domains.join(', ') }}
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <router-link v-if="user.organization_id" :to="`/admin/organizations/${user.organization_id}`">
          <Button variant="ghost" size="icon">
            <ExternalLink class="h-4 w-4" />
          </Button>
        </router-link>
      </div>
    </SettingsRow>

    <!-- Organization Role -->
    <SettingsRow
      v-if="user.organization_id"
      label="Role"
      description="User's role within the organization"
    >
      <Select v-model="selectedRole" :disabled="savingRole" @update:model-value="onRoleChange">
        <SelectTrigger class="w-[150px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="role in roleItems" :key="role.value" :value="role.value">
            {{ role.title }}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Check, ChevronsUpDown, ExternalLink } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const orgPopoverOpen = ref(false);

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
