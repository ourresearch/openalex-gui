<template>
  <div class="serp-api-editor">
    <v-card
        flat
        style="font-family: Monaco, monospace; min-height: 40px;"
        class="rounded-o d-flex align-center pa-2 pr-3"
    >
      <v-icon class="mr-3 mt-1 ml-1" color="grey">mdi-api</v-icon>
      <div class="flex-grow-1 mt-1">
        https://api.openalex.org/{{ entityType }}<span v-html="apiQuerySplittable"></span>
      </div>
      <v-btn
        icon
        variant="text"
        @click="copyToClipboard"
        class="ml-4"
      >
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
    </v-card>
  </div>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {filtersFromUrlStr} from "@/filterConfigs";


export default {
  name: "SerpApiEditor",
  components: {
  },
  props: {},
  data() {
    return {
      url,
    }
  },
  computed: {
    api() {
      return api
    },
    ...mapGetters([
      "entityType",
    ]),
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    apiUrl() {
      return url.makeApiUrl(this.$route)
    },
    apiQuerySplittable() {
      const url = new URL(this.apiUrl);
      const parts = url.search.split(/(?=[&,])/).map(part => {
        return part;
      })
      return parts.join("<wbr>");
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    async copyToClipboard() {
      await navigator.clipboard.writeText(this.apiUrl);
      this.snackbar("URL copied to clipboard.")
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route": {
      immediate: true,
      handler() {
        // this.apiUrl = to.fullPath
      }
    }
  }
}
</script>


<style lang="scss">

</style>