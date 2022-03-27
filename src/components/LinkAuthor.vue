<template>
  <router-link :to="data.id | idLink" style="display: inline-block; white-space: nowrap;">
    {{data.display_name}}{{ (appendComma) ? ',' : '' }}</router-link>

</template>


<script>

export default {
  components: {
  },
  props: {
    data: Object,
    appendComma: Boolean,
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