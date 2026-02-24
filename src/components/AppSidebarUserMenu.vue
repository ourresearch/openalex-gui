<template>
  <v-menu v-model="menuOpen" location="right" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-tooltip location="right" text="Account">
        <template #activator="{ props: tooltipProps }">
          <div
            class="sidebar-avatar-btn"
            v-bind="{ ...menuProps, ...tooltipProps }"
          >
            <v-avatar size="32" :color="avatarColor">
              <span class="text-white text-body-2 font-weight-medium">{{ userInitial }}</span>
            </v-avatar>
          </div>
        </template>
      </v-tooltip>
    </template>

    <v-card min-width="240">
      <div class="menu-header pa-3">
        <div class="d-flex align-center">
          <v-avatar size="28" :color="avatarColor" class="mr-2">
            <span class="text-white" style="font-size: 12px; font-weight: 500;">{{ userInitial }}</span>
          </v-avatar>
          <div>
            <div class="d-flex align-center">
              <span class="font-weight-bold" style="font-size: 14px;">{{ userName }}</span>
              <v-chip
                v-if="isAdmin"
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                Site admin
              </v-chip>
              <v-chip
                v-else-if="isSiteCurator"
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                Site curator
              </v-chip>
            </div>
            <div style="font-size: 12px; color: #6B7280;">{{ userEmail }}</div>
          </div>
        </div>
      </div>

      <v-divider />

      <v-list density="compact">
        <v-list-item to="/settings" prepend-icon="mdi-cog-outline" @click="menuOpen = false">
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item href="https://help.openalex.org/" target="_blank" prepend-icon="mdi-help-circle-outline" @click="menuOpen = false">
          <v-list-item-title>Help center</v-list-item-title>
        </v-list-item>

        <v-list-item href="https://developers.openalex.org/" target="_blank" prepend-icon="mdi-code-tags" @click="menuOpen = false">
          <v-list-item-title>Developer center</v-list-item-title>
        </v-list-item>

        <v-menu location="right" open-on-hover :close-on-content-click="false">
          <template #activator="{ props: subMenuProps }">
            <v-list-item v-bind="subMenuProps" prepend-icon="mdi-information-outline">
              <v-list-item-title>Learn more</v-list-item-title>
              <template #append>
                <v-icon style="font-size: 16px !important; opacity: 0.5 !important;">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>
          <v-list density="compact">
            <v-list-item to="/about" @click="menuOpen = false">
              <v-list-item-title>About OpenAlex</v-list-item-title>
            </v-list-item>
            <v-list-item to="/pricing" @click="menuOpen = false">
              <v-list-item-title>Pricing</v-list-item-title>
            </v-list-item>
            <v-list-item to="/legal" @click="menuOpen = false">
              <v-list-item-title>Terms and policies</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <template v-if="isAdmin">
          <v-divider class="my-1" />
          <v-list-item to="/admin" prepend-icon="mdi-crown-outline" @click="menuOpen = false">
            <v-list-item-title>Admin</v-list-item-title>
          </v-list-item>
        </template>

        <v-divider class="my-1" />

        <v-list-item prepend-icon="mdi-logout" @click="logout">
          <v-list-item-title>Log out</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'AppSidebarUserMenu' });

const store = useStore();
const menuOpen = ref(false);

const userId = computed(() => store.getters['user/userId']);
const userName = computed(() => store.getters['user/userName']);
const userEmail = computed(() => store.getters['user/userEmail']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const isSiteCurator = computed(() => store.getters['user/isSiteCurator']);

// Avatar colors (same as UserToolbarMenu)
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2',
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

const userInitial = computed(() => {
  if (userName.value) return userName.value.charAt(0).toUpperCase();
  if (userEmail.value) return userEmail.value.charAt(0).toUpperCase();
  return '?';
});

const avatarColor = computed(() => {
  const str = userId.value || userEmail.value || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
});

const logout = () => {
  store.commit('user/logout');
  store.commit('snackbar', "You're logged out");
};
</script>

<style scoped>
.menu-header {
  background: #FAFAFA;
}

.sidebar-avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.sidebar-avatar-btn:hover {
  background-color: #F0F0F0;
}

</style>
