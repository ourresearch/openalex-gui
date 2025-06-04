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


<script>

export default {
  name: "WorkAuthorsString",
  components: {},
  props: {
    authorships: Array,
  },
  data() {
    return {
    }
  },
  computed: {
    authorsCount() {
      return this.authorships.length
    },
    authorNames() {
      return this.authorships.map(a => a.author.display_name)
    },
  },
  methods: {
  },
}
</script>


<style scoped lang="scss">

</style>