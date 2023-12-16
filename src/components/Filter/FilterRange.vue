<template>
  <div class="filter filter-range d-flex align-center">
    <v-icon  left>{{ config.icon }}</v-icon>
    <div>
      <span>the {{ config.displayName }} is</span>
      <span>
        <v-text-field
              class="pa-0  ml-2"
              style="display: inline-block; font-size: 20px;"
              v-model="searchString"
              hide-details
              @keydown.enter="submit"
              prepend-inner-icon="mdi-pencil-outline"
              @blur="submit"
          >
          </v-text-field>
      </span>
    </div>
    <v-spacer />
    <v-btn icon @click="$emit('delete')">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import Template from "@/components/Filter/FilterSelect.vue";


import EditPhraseSearch from "@/components/EditPhrase/EditPhraseSearch.vue";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "FilterValueSearch",
  components: {
    EditPhraseSearch,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      isDialogOpen: false,
      searchString: url.readFilterValue(this.$store.state.entityType, this.filterKey),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    isActive() {
      return this.$store.state.activeFilter === this.filterKey
    },
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },
    submit() {
      url.upsertFilter(
          this.entityType,
          this.filterKey,
          this.searchString
      )
      this.$store.state.activeFilter = null
      this.$emit("submit")
    },
    onClickOutside() {
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style  lang="scss">
input {
  padding: 0 3px !important;
}
.phrase-search {

}

input:focus, textarea:focus, select:focus {
  //outline: none;
}

</style>