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
      // Prefer raw_author_name (the original name from the source)
      if (a?.raw_author_name) {
        return a.raw_author_name;
      }
      // Fall back to author's display_name if raw_author_name not available
      if (a?.author?.display_name) {
        return a.author.display_name;
      }
      // Last resort fallback
      return 'Unknown author';
    })
    .filter(name => name); // Remove any null/undefined values
});
</script>


<style scoped lang="scss">

</style>