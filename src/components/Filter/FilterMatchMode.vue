<template>
  <v-chip
      outlined
      style="cursor: pointer; font-size: 20px;"
      @click="toggleMode"
  >
    {{ (value === 'any') ? 'or' : 'and' }}
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import { url} from "@/url";

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
      get(){
        return url.readFilterMatchMode(this.entityType, this.filterKey)
      },
      set(to){
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
    toggleMode(){
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