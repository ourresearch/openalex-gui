<template>
  <nav class="dashboard-breadcrumbs" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in items" :key="index" class="breadcrumb-item">
        <router-link
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="breadcrumb-link"
        >
          {{ item.text }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ item.text }}</span>
        <v-icon
          v-if="index < items.length - 1"
          size="14"
          class="breadcrumb-separator"
        >
          mdi-chevron-right
        </v-icon>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => items.every(item => item.text)
  }
});
</script>

<style scoped>
.dashboard-breadcrumbs {
  margin-top: -24px;
  margin-bottom: 24px;
  padding-top: 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-wrap: wrap;
  gap: 4px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link {
  font-size: 13px;
  font-weight: 500;
  color: #6B6B6B;
  text-decoration: none;
  transition: color 0.15s;
}

.breadcrumb-link:hover {
  color: #1A1A1A;
  text-decoration: none;
}

.breadcrumb-current {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A1A;
}

.breadcrumb-separator {
  color: #9CA3AF;
}
</style>
