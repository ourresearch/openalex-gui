<template>
  <v-container>
    <div class="caption">Author</div>
    <h1 class="text-h3">{{ data.title }}</h1>

    <pre class="mt-12 pt-12">
      {{ data }}
    </pre>

  </v-container>


</template>


<script>

export default {
  name: "EntityWork",
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
  computed: {},
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style lang="scss">


</style>