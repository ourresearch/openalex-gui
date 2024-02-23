<template>
  <v-menu>
    <template v-slot:activator="{on}">
      <v-btn v-on="on" icon><v-icon>mdi-sort-ascending</v-icon></v-btn>
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
              @click="clickOption(key)"
          >
            <v-list-item-icon>
              <v-icon>{{ option.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ option.displayName }}
              </v-list-item-title>
            </v-list-item-content>
<!--            <v-list-item-action>-->
<!--              <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>-->
<!--            </v-list-item-action>-->
          </v-list-item>
          <v-divider/>
          <v-list-item @click="isDialogOpen.more = true">
            <v-icon>mdi-dots-horizontal</v-icon>
            <v-list-item-content>
              <v-list-item-title>More</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

        </v-list>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      isDialogOpen: {
        more: false
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    selectedOptions() {
      return url.getActionValueKeys(this.$route, this.action)
    },
    popularOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes("sort"))
    },
    menuOptions() {
      return this.popularOptions

      const ret = [...this.popularOptions]
      this.selectedOptions.forEach(optionKey => {
        if (!this.popularOptions.includes(optionKey)) {
          ret.push(optionKey)
        }
      })
      return ret
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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