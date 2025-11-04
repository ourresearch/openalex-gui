<template>
  <div class="dv2-banner">
    <v-container fluid class="py-2 ma-0">
      <div class="text-center text-body-2">
        Data Version 2 is live!
        <a 
          href="https://docs.google.com/document/d/1SPZ7QFcPddCHYt1pZP1UCIuqbfBY22lSHwgPA8RQyUY/edit?tab=t.0#heading=h.vkad9z24cli" 
          target="_blank"
          rel="noopener noreferrer"
          class="read-more-link ml-1"
        >
          Learn more here.
        </a>
      </div>
    </v-container>
  </div>
</template>

<script setup>
defineOptions({ name: 'DataVersionBanner' });
</script>

<style scoped>
.dv2-banner {
  background-color: #E3F2FD; /* blue-lighten-5 */
}

.read-more-link {
  text-decoration: none;
  font-weight: 500;
}

.read-more-link:hover {
  text-decoration: underline;
}
</style>
