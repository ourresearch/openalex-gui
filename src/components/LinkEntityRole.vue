<template>
  <span>
    <router-link :to="linkTo" class="text-decoration-none">
      {{ displayName }}
      <span class="caption">({{ role.works_count | millify }}){{(appendComma) ? "," : ""}}</span>
    </router-link>

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersAsUrlStr} from "@/filterConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {entityConfigs} from "@/entityConfigs";
import _ from "lodash"

export default {
  name: "LinkEntityRole",
  components: {},
  props: {
    appendComma: Boolean,
    role: Object,
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
    myEntityConfig() {
      return entityConfigs[this.role.role + "s"];
    },
    displayName() {
      const name = _.capitalize(this.role.role.trim())
      return name
    },
    myFilter(){
      return createSimpleFilter(
          "works",
          this.myEntityConfig.filterKey,
          this.role.id
      )
    },
    linkTo(){
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