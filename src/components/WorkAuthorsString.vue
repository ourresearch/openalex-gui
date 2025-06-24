<template>
  <span>
    <span v-if="authorsCount" class="">
      <span>{{ authorNames[0] }}</span>
      <span v-if="authorNames.length > 1">, {{ authorNames[1] }}</span>
      <span v-if="authorNames.length > 2">, et al.</span>
    </span>
    <span v-else>
      No authors
    </span>
  </span>
</template>


<script setup>
import { computed } from 'vue';

defineOptions({ name: 'WorkAuthorsString' });

const props = defineProps({
  authorships: Array,
});

const authorsCount = computed(() => props.authorships.length);
const authorNames = computed(() => props.authorships.map(a => a.author.display_name));
</script>


<style scoped lang="scss">

</style>