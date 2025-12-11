<template>
  <div>
    <div class="text-h5 mb-4">Organization</div>
    
    <v-card flat variant="outlined" class="bg-white">
      <template v-if="hasOrganization">
        <v-list lines="two">
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="grey">mdi-domain</v-icon>
            </template>
            <v-list-item-title class="text-grey">Organization</v-list-item-title>
            <v-list-item-subtitle class="text-body-1 text-black">
              {{ organizationName }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-divider />
          
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="grey">mdi-account-badge-outline</v-icon>
            </template>
            <v-list-item-title class="text-grey">Organizational Role</v-list-item-title>
            <v-list-item-subtitle class="text-body-1 text-black">
              {{ formattedRole }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </template>
      <template v-else>
        <v-card-text class="text-medium-emphasis">
          You're not linked to any organizational account on OpenAlex.
        </v-card-text>
      </template>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'MeOrganization' });

useHead({ title: 'Organization' });

const store = useStore();

const organizationId = computed(() => store.state.user.organizationId);
const organizationName = computed(() => store.state.user.organizationName);
const organizationRole = computed(() => store.state.user.organizationRole);

const hasOrganization = computed(() => !!organizationId.value);

const formattedRole = computed(() => {
  if (!organizationRole.value) return 'Not set';
  return organizationRole.value.charAt(0).toUpperCase() + organizationRole.value.slice(1);
});
</script>
