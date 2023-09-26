<template>
  <v-card>
    <v-card-title>
      Download as CSV
    </v-card-title>
    <div class="pa-4">
      <div class="">Preparing your download now...</div>
      <div class="text-h1 font-weight-bold">0%</div>
    </div>
  </v-card>
</template>


<script>
export default {
  name: "DownloadCsvDialog",
  components: {
  },
  props: {
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    conceptNamesString(){
      return this.data.x_concepts.slice(0, 4).map(c => c.display_name).join(", ")
    },
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