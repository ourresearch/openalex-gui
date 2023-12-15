<template>
  <span class="phrase phrase-search" @click="isDialogOpen = true">
    <span>
      {{ myFilterConfig.displayName }}
      <q>{{ text }}</q>
    </span>
     <EditPhraseSearch
         :filter-key="filterKey"
         v-model="isDialogOpen"
     />


  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import Template from "@/components/FilterPhrase/FilterPhraseSelect.vue";


import EditPhraseSearch from "@/components/EditPhrase/EditPhraseSearch.vue";
import {filter} from "core-js/internals/array-iteration";

export default {
  name: "FilterValueSearch",
  components: {
    Template,
    EditPhraseSearch,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,


      isDialogOpen: false,
      text: url.readFilterValue(this.$store.state.entityType, this.filterKey),
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
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
    onDelete() {
      if (this.searchString) return
      url.deleteFilter(this.entityType, this.filterKey)
      this.$store.state.activeFilter = null
    },
    openDialog() {
      this.isDialogOpen = true
      this.searchString = url.readFilterValue(this.$store.state.entityType, this.filterKey)
    },
    closeDialog() {
      this.isDialogOpen = false
      this.searchString = ""
    }


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