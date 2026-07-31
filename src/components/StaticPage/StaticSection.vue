<template>
  <section :id="id" class="section compact-section">
    <h2 class="section-header" :class="{ 'has-aside': $slots.aside }">
      <span class="section-header-text">
        {{ title }}
        <a :href="'#' + id" class="permalink" @click.prevent="scrollToSection(id)"><v-icon size="18">mdi-link-variant</v-icon></a>
      </span>
      <span v-if="$slots.aside" class="section-header-aside"><slot name="aside" /></span>
    </h2>
    <slot />
  </section>
</template>

<script setup>
defineOptions({ name: 'StaticSection' });

defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
});

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}
</script>
