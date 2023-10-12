<template>
  <div class="serp-api-editor" style="min-height: 80px;">
    <!--      <v-toolbar dense color="transparent" flat>-->
    <!--        <v-toolbar-title>-->
    <!--          <v-icon left>mdi-api</v-icon>-->
    <!--          API Query-->
    <!--        </v-toolbar-title>-->
    <!--        <v-spacer/>-->
    <!--        <v-btn-->
    <!--            icon-->
    <!--            @click="copyToClipboard(apiUrl)"-->
    <!--        >-->
    <!--          <v-icon>mdi-content-copy</v-icon>-->
    <!--        </v-btn>-->
    <!--        <v-btn icon @click="$emit('close')">-->
    <!--          <v-icon>mdi-close</v-icon>-->
    <!--        </v-btn>-->
    <!--      </v-toolbar>-->
    <v-card
        rounded
        dark
        style="font-family: Monaco, monospace;"
        class="d-flex align-start pa-2"
    >
      <v-icon class="mr-3 mt-1 ml-1">mdi-api</v-icon>
      <div class="flex-grow-1 mt-1">
          <span class="entity-type">
            /{{ $route.params.entityType }}
          </span>
        <span v-if="$route.query.page">
            ?page={{ $route.query.page }}
          </span>
        <span class="filters" v-if="filters.length">
            &filter=
            <span
                v-for="(filter, i) in filters"
                :key="filter.asStr"
            >
              {{ filter.asStr }}<template v-if="i < filters.length-1">,</template>
            </span>
          </span>
        <span class="group-by" v-if="$route.query.group_by">
            &group_by={{ $route.query.group_by }}
          </span>
        <span v-if="$route.query.sort">
            &sort={{ $route.query.sort }}
          <!--            <sort-button text-mode />-->
          </span>


      </div>
      <v-btn
          icon
          @click="copyToClipboard"
      >
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
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
          <v-list-item
              :href="apiUrl"
              target="_blank"
          >
            <v-list-item-icon>
              <v-icon>mdi-code-json</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              View JSON response
            </v-list-item-title>
          </v-list-item>
        </v-list>

      </v-menu>
    </v-card>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersFromUrlStr} from "@/filterConfigs";
import SortButton from "@/components/SortButton.vue";
import {url} from "@/url";
import {api} from "@/api";

export default {
  name: "Template",
  components: {
    SortButton,
  },
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    api() {
      return api
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    apiUrl() {
      return url.makeApiUrl(this.$route)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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
      handler(to, from) {
        // this.apiUrl = to.fullPath
      }
    }

  }
}
</script>

<style lang="scss">
.serp-api-editor {
  a {
    //color: #fff !important;

    &:hover {
      //text-decoration: underline !important;
    }
  }
}

</style>