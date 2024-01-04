<template>

  <v-chip
      class="ml-2"
      filter
      @click="toggleMode"
      outlined
      :input-value="value === 'all'"
      small
  >
    all
  </v-chip>

  <!--  <v-chip-->
  <!--      small-->
  <!--      @click="toggleMode"-->
  <!--      class="pa-0"-->
  <!--  >-->
  <!--    <v-chip-->
  <!--        small-->
  <!--        :dark="value === 'any'"-->
  <!--    >-->
  <!--      or-->
  <!--    </v-chip>-->
  <!--    <v-chip-->
  <!--        small-->
  <!--        :dark="value === 'all'">-->
  <!--      and-->
  <!--    </v-chip>-->
  <!--  </v-chip>-->
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
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
    value: {
      get() {
        return url.readFilterMatchMode(this.entityType, this.filterKey)
      },
      set(to) {
        url.setFilterMatchMode(
            this.entityType,
            this.filterKey,
            to
        )
      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    toggleMode() {
      this.value = (this.value === "any") ?
          "all" :
          "any"
    }


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