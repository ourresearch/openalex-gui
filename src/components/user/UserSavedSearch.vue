<template>
  <v-list-item :disabled="disabled" @click="open">
    <v-list-item-icon>
      <v-icon>mdi-content-save-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ name }}
<!--        {{ isOpenAsSerpTab ? "(open)" : "" }}-->
      </v-list-item-title>
      <v-list-item-subtitle>
<!--        Last updated -->
        {{  updatedStr }}
<!--        {{ "filters" | pluralize(filters?.length) }}-->
      </v-list-item-subtitle>
      <div>
      </div>
    </v-list-item-content>
    <v-list-item-action v-if="!isOpener">
      <v-btn icon @click.stop="deleteSavedSearch(id)" :disabled="disabled">
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";

export default {
  name: "UserSavedSearch",
  components: {},
  props: {
    searchUrl: String,
    id: String,
    isOpener: Boolean,
    updated: String,
  },
  data() {
    return {
      url,
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "serpTabs",
    ]),
    filters() {
      const url = new URL(this.searchUrl)
      const filterStr = url.searchParams.get("filter") ?? "Everything"
      return filtersFromUrlStr(this.entityType, filterStr)
    },
    name() {
      const url = new URL(this.searchUrl)
      const name = url.searchParams.get("name") ?? "Untitled search"
      return name
    },

    disabled() {
      return this.isOpener && this.isOpenAsSerpTab
    },
    updatedStr(){
      const dateOptions =  {
        month: "short",
        weekday: "short",
        day: "numeric"
      }
      const timeOptions = {
        timeStyle: "short",
      }


      const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));
      const updatedDate = new Date(this.updated)

      return (updatedDate < oneDayAgo) ?
          updatedDate.toLocaleDateString(undefined, dateOptions) :
          updatedDate.toLocaleTimeString(undefined, timeOptions)

    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "deleteSavedSearch",
      "createSerpTab",
      "selectSerpTab",
    ]),
    ...mapActions([]),
    open() {
      this.$emit("click")
      this.$router.push(url.urlObjectFromSearchUrl(this.searchUrl))
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