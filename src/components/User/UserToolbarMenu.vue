<template>
  <div class="d-flex align-center">
    <ui-variant-selector v-if="false && isAdmin" />
    
    <!-- Admin dashboard link -->
    <v-btn v-if="userId && isAdmin" icon variant="plain" to="/admin">
      <v-icon>mdi-crown-outline</v-icon>
      <v-tooltip activator="parent" location="bottom">Admin Dashboard</v-tooltip>
    </v-btn>

    <!-- Organization dashboard link (for org owners) -->
    <v-btn v-if="userId && isOrgOwner && organizationId" icon variant="plain" :to="`/organizations/${organizationId}`">
      <v-icon>mdi-domain</v-icon>
      <v-tooltip activator="parent" location="bottom">Organization</v-tooltip>
    </v-btn>

    <!-- User account link -->
    <v-btn v-if="userId" icon variant="plain" to="/me/about">
      <v-icon>mdi-account-circle-outline</v-icon>
      <v-tooltip activator="parent" location="bottom">Account</v-tooltip>
    </v-btn>

    <div v-else>
      <!-- Login / Sign up links-->
      <template v-if="smAndDown">
        <v-menu location="bottom">
          <template v-slot:activator="{props}">
            <v-btn icon variant="plain" v-bind="props">
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/signup">
              <template #prepend>
                <v-icon>mdi-account-plus</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">
                Sign Up
              </v-list-item-title>
              <v-list-item-subtitle>
                Create a new account
              </v-list-item-subtitle>  
            </v-list-item>
            <v-list-item to="/login">
              <template #prepend>
                <v-icon>mdi-account-arrow-right</v-icon>
              </template>
              <v-list-item-title>
                Log In
              </v-list-item-title>
              <v-list-item-subtitle>
                Access your existing account
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider/>
            
            <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
              <template #prepend>
                <v-icon>mdi-comment-question-outline</v-icon>
              </template>
              <v-list-item-title>
                Contact support
              </v-list-item-title>
            </v-list-item>

            <v-list-item href="https://help.openalex.org/" target="_blank">
              <template #prepend>
                <v-icon>mdi-help-circle-outline</v-icon>
              </template>
              <v-list-item-title>
                Visit help center
              </v-list-item-title>
            </v-list-item>

          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn
          variant="text"
          rounded
          to="/login"
        >
          Log In
        </v-btn>
        <v-btn
          rounded
          variant="text"
          to="/signup"
        >
          Sign Up
        </v-btn>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

import UiVariantSelector from '../Misc/UiVariantSelector.vue';

defineOptions({ name: 'UserToolbarMenu' });

const store = useStore();

const { smAndDown } = useDisplay();

const userId = computed(() => store.getters['user/userId']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const isOrgOwner = computed(() => store.getters['user/isOrgOwner']);
const organizationId = computed(() => store.getters['user/organizationId']);
</script>


<style scoped lang="scss">
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
</style>