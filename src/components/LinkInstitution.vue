<template>
  <router-link :to="data.id | idLink">
    {{data.display_name}}
  </router-link>
</template>


<script>

export default {
  components: {
  },
  props: {
    data: Object,
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