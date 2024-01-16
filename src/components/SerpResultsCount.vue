<template>
  <div class="d-flex align-center">
        <div v-if="$vuetify.breakpoint.smAndDown" class="">
          <span class="font-weight-bold grey--text">{{ resultsObject?.meta.count | millify }}</span> {{entityType | pluralize(2)}}
        </div>
    <div v-else class="grey--text">
      <span v-if="resultsObject?.meta?.count >= 1000">About </span><span class="font-weight-bold">{{ resultsObject?.meta.count | toPrecision }}</span> {{entityType | pluralize(2)}}
<!--              ({{resultsObject?.meta?.db_response_time_ms / 1000 | toPrecision(2) }} seconds)-->
      <!--      </span>-->
    </div>

    <v-spacer/>
    <action class="ml-2" action="sort"/>


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