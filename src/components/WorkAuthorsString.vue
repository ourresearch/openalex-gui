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

const authorsCount = computed(() => props.authorships?.length || 0);
const authorNames = computed(() => {
  if (!props.authorships) return [];
  return props.authorships
    .map(a => {
      // First try to get the author's display name from the author object
      if (a?.author?.display_name) {
        return a.author.display_name;
      }
      // Fall back to raw_author_name if available
      if (a?.raw_author_name) {
        return a.raw_author_name;
      }
      // Last resort fallback
      return 'Unknown author';
    })
    .filter(name => name); // Remove any null/undefined values
});
</script>


<style scoped lang="scss">

</style>