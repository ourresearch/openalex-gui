<template>
  <v-container>
    <div class="caption">Concept</div>
    <h1 class="text-h3">{{ data.display_name }}</h1>

    <pre class="mt-12 pt-12">
      {{ data }}
    </pre>

  </v-container>


</template>


<script>

export default {
  name: "EntityConcept",
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