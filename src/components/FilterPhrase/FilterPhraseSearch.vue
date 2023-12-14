<template>
  <span>
    <span>
      {{ myFilterConfig.displayName }}:
    </span>
    <span
        v-if="isActive"
    >
      <input
          type="text"
          v-model="text"
          :id="'input.' + filterKey"
          style="border: none !important; padding:0;"
          @keyup.enter="submit"
          @keydown.delete="onDelete"
          v-click-outside="onClickOutside"
          autofocus
      >

    </span>
    <span v-else @click="$store.state.activeFilter = filterKey">
      <q>{{ text }}</q>

    </span>

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import FilterEditSearch from "@/components/FilterEdit/FilterEditSearch.vue";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";
import Template from "@/components/FilterPhrase/FilterPhraseSelect.vue";

export default {
  name: "FilterValueSearch",
  components: {
    Template,
    FilterEditRange,
    FilterEditSearch,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,

      isDialogOpen: false,
      text: url.readFilterValue(this.$store.state.entityType, this.filterKey),
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
    isActive(){
      return this.$store.state.activeFilter === this.filterKey
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      url.upsertFilter(
          this.entityType,
          this.filterKey,
          this.text
      )
      this.$store.state.activeFilter = null
      this.$emit("submit")
    },
    onClickOutside(){
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }
    },
    onDelete() {
      if (this.text) return
      url.deleteFilter(this.entityType, this.filterKey)
      this.$store.state.activeFilter = null
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

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}
input:focus, textarea:focus, select:focus {
  //outline: none;
}

</style>