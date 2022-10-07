<template>
  <router-link
      class="text-decoration-none"
      :to="data.id | zoomLink">{{data.display_name}}{{ append }}</router-link>
</template>


<script>

export default {
  components: {
  },
  props: {
    data: Object,
    append: String,
    surroundWithParens: Boolean,
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