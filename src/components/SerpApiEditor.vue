<template>
  <div class="serp-api-editor">
    <v-card
        flat
        rounded
        style="font-family: Monaco, monospace; min-height: 40px;"
        class="d-flex align-start pa-2 color-1"

    >
      <v-icon class="mr-3 mt-1 ml-1">mdi-api</v-icon>
      <div class="flex-grow-1 mt-1">
        /works<span v-html="apiQuerySplittable"></span>
<!--        <span v-for="part in apiQuerySplittable" :key="part">-->
<!--        {{ part }}-->
<!--      </span>-->
        <!--          <span class="entity-type">-->
        <!--            /{{ $route.params.entityType }}-->
        <!--          </span>-->
        <!--        <template v-if="$route.query.page">-->
        <!--          ?page={{ $route.query.page }}-->
        <!--        </template>-->
        <!--        <span class="filters" v-if="filters.length">-->
        <!--            &filter=-->
        <!--            <span-->
        <!--                v-for="(filter, i) in filters"-->
        <!--                :key="filter.asStr"-->
        <!--            >-->
        <!--              {{ filter.asStr }}<template v-if="i < filters.length-1">,</template>-->
        <!--            </span>-->
        <!--          </span>-->
        <!--        <span class="group-by" v-if="$route.query.group_by">-->
        <!--            &group_by={{ $route.query.group_by }}-->
        <!--          </span>-->
        <!--        <span v-if="$route.query.sort">-->
        <!--            &sort={{ $route.query.sort }}-->
        <!--          &lt;!&ndash;            <sort-button text-mode />&ndash;&gt;-->
        <!--          </span>-->


      </div>
      <v-btn
          icon
          @click="copyToClipboard"
      >
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
      <v-btn
          icon
          @click="url.setShowApi(undefined)"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
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
      url,
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
    },
    apiQuerySplittable() {
      const url = new URL(this.apiUrl)
      const parts = url.search.split(/(?=[&,])/).map((part, i) => {
        return part
        const prepend = (i > 0) ? "&" : ""
        return prepend + part
      })
      return parts.join("<wbr>")
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
    hideMe() {

    }


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