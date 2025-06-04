<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-btn v-bind="props" icon>
        <v-icon>mdi-sort-ascending</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-subheader>
        Sort by:
      </v-subheader>
      <v-divider/>
      <v-list-item
          v-for="option in menuOptions"
          :key="option.key"
          color="primary"
          @click="clickOption(option.key)"
          :disabled="menuOptions.length === 1"
      >
        <v-list-item-icon>
          <v-icon :disabled="menuOptions.length === 1">{{ option.icon }}</v-icon>
        </v-list-item-icon>
        
          <v-list-item-title>
            {{ option.displayName }}
          </v-list-item-title>
        
        <v-list-item-action class="pl-3 pt-2">
          <v-icon v-if="selectedOption === option.key">mdi-check</v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-menu>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "SerpResultsSortButton",
  components: {},
  props: {},
  data() {
    return {
      isDialogOpen: {
        more: false
      }
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    selectedOption() {
      return url.getSort(this.$route)
    },
    popularOptions() {
      const optionsFromConfigs = facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes("sort"))
      if (url.isSearchFilterApplied(this.$route)) {
         optionsFromConfigs.unshift({
          key: "relevance_score",
          icon: "mdi-magnify",
          displayName: "relevance score",
        })
      }
      return optionsFromConfigs
    },
    menuOptions() {
      return this.popularOptions
    },
  },
  methods: {
    clickOption(key) {
      //console.log("SerpResultsSortButton clickOption(): ", key)
      url.setSort(key)
    },
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