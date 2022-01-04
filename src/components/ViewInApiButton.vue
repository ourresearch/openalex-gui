<template>
  <v-btn color="primary" class="mr-4" :href="apiUrl" target="_blank">
    View in API
  </v-btn>

</template>


<script>

export default {
  components: {},
  props: {
    id: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    apiUrl() {
      const shortId = this.id.replace("https://openalex.org/", "")
      return `https://api.openalex.org/${shortId}`
    }
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">


</style>