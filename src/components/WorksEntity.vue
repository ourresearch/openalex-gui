<template>
  <div>
    Work Entity component
    <pre>
      {{data}}
    </pre>

  </div>


</template>


<script>


export default {
  name: "WorkEntity",
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
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss">


</style>