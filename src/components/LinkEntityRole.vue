<template>
  <span>
    <router-link :to="linkTo" class="text-decoration-none">
      {{ displayName }}
      <span class="caption">({{ filters.millify(role.works_count) }}){{(appendComma) ? "," : ""}}</span>
    </router-link>

  </span>
</template>

<script>

import _ from "lodash"

import filters from "@/filters";
import {filtersAsUrlStr} from "@/filterConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {entityConfigs} from "@/entityConfigs";

export default {
  name: "LinkEntityRole",
  components: {},
  props: {
    appendComma: Boolean,
    role: Object,
  },
  data() {
    return {
      filters,
    }
  },
  computed: {
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
    filters,
  },
}
</script>


<style scoped lang="scss">

</style>