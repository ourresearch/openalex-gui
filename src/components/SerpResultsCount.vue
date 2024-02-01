<template>
  <div class="">
    <template v-if="$vuetify.breakpoint.smAndDown" class="">
      <span class="font-weight-bold ">{{ resultsObject?.meta.count | millify }}</span> results
    </template>
    <template v-else class="">
      <span v-if="resultsObject?.meta?.count >= 1000">About </span><span
        class="font-weight-bold">{{ resultsObject?.meta.count | toPrecision }}</span> results
      <span v-if="includeTime">({{resultsObject?.meta?.db_response_time_ms / 1000 | toPrecision(2) }} seconds)</span>
    </template>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";

export default {
  name: "Template",
  components: {Action},
  props: {
    resultsObject: Object,
    includeTime: Boolean
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