<template>
  <v-menu>
    <template v-slot:activator="{on}">
      <v-btn
          icon
          v-on="on"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list>

      <v-list-item :href="csvUrl">
        <v-list-item-icon>
          <v-icon>mdi-tray-arrow-down</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Export</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action-text>.csv</v-list-item-action-text>
      </v-list-item>
      <v-list-item :href="apiUrl" target="_blank">
        <v-list-item-icon>
          <v-icon>mdi-api</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            View in API
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action-text>.json</v-list-item-action-text>
      </v-list-item>
      <v-divider/>
      <v-list-item @click="isPinned = !isPinned">
        <v-list-item-icon>
          <v-icon color="">{{ isPinned ? "mdi-playlist-remove" : "mdi-playlist-plus" }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="">
            {{ isPinned ? "Remove from" : "Add to" }} report
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
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
      url,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    isPinned: {
      get() {
        return url.getGroupBy(this.$route).includes(this.filterKey)
      },
      set(to) {
        return to ? url.addGroupBy(this.filterKey) : url.deleteGroupBy(this.filterKey)
      }
    },
    apiUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
          }
      )
    },
    csvUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
            formatCsv: true,
          }
      )
    },
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