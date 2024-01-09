<template>
  <v-toolbar flat class="">
    <v-toolbar-title>Results</v-toolbar-title>

    <v-spacer/>

    <action class="ml-2" action="sort"/>
    <export-button class="ml-2"/>


  </v-toolbar>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";
import ExportButton from "@/components/ExportButton.vue";

export default {
  name: "Template",
  components: {
    Action,
    ExportButton,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>