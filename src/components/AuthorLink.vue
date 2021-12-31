<template>
  <a :href="data.id">
    {{data.display_name}}
  </a>
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