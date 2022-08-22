<template>
  <router-link
      :to="data.id | zoomLink"
      style="display: inline-block; white-space: nowrap;"
      class="text-decoration-none"
  >{{data.display_name}}{{ append }}</router-link>

</template>


<script>

export default {
  components: {
  },
  props: {
    data: Object,
    append: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
  },
  created() {},
  mounted() {},
  watch: {}
}
</script>

<style lang="scss">


</style>