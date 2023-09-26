<template>
  <router-link :to="linkTo">
    {{ displayName }}
  </router-link>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersAsUrlStr} from "@/filterConfigs";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "LinkRepository",
  components: {},
  props: {
    appendComma: Boolean,
    repository: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    displayName() {
      const name = this.repository.display_name.replace(/\(.+?\)/, "").trim()
      const comma = (this.appendComma) ? "," : ""
      return name + comma
    },
    myFilter(){
      return createSimpleFilter(
          "works",
          "repository",
          this.repository.id
      )
    },
    linkTo(){
      console.log("linkTo", this.myFilter)

      return {
        name: "Serp",
        params: {entityType: "works"},
        query: { filter: filtersAsUrlStr([this.myFilter])}
      }
    }
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
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>