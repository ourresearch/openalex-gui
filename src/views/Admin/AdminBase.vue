<template>
  <div class="color-2 py-8">
    <v-container>
      <v-row>
        <v-col cols="12" md="3">
          <v-card flat class="bg-transparent">
            <div class="text-h5 mb-4">Admin</div>
            <v-list nav density="comfortable" class="bg-transparent">
              <v-list-item
                v-for="item in navItems"
                :key="item.route"
                :to="item.route"
                :prepend-icon="item.icon"
                :title="item.title"
                :subtitle="item.subtitle"
                rounded="lg"
                class="mb-1"
                :disabled="item.disabled"
              />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="9">
          <router-view />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
defineOptions({ name: 'AdminBase' });

const navItems = [
  { title: 'Users', route: '/admin/users', icon: 'mdi-account-group-outline' },
  { title: 'Exports', route: '/admin/exports', icon: 'mdi-download-outline', subtitle: 'Coming soon', disabled: true },
  { title: 'Edits', route: '/admin/edits', icon: 'mdi-pencil-outline', subtitle: 'Coming soon', disabled: true },
];
</script>

<style lang="scss" scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
