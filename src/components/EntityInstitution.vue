<template>
  <v-container>
    <div class="">
      <strong>
        🏫 Institution
      </strong>
    </div>
      <a :href="data.id" class="black--text body-2">{{ data.id }}</a>
    <h1 class="text-h3 my-6">{{ data.display_name }}</h1>

    <pre class="mt-12 pt-12">
      {{ data }}
    </pre>

  </v-container>


</template>


<script>

export default {
  name: "EntityInstitution",
  components: {},
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