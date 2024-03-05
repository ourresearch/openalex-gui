<template>
  <filter-base :filter-key="filterKey" :index="index">
    <td class="d-flex flex-wrap align-center">
      <template
          v-for="(id, i) in optionIds"
      >
        <filter-select-option
            class=""
            :key="id"
            :filter-value="id"
            :filter-key="filterKey"
            :position="i"
            @delete="deleteOption(id)"
        />
        <span
            :key="'or'+i"
            v-if="i < optionIds.length-1"
            class="mx-1 mr-2 grey--text"
        >
          or
        </span>
      </template>

      <v-btn class="" icon @click.stop="isActive = true">
        <v-icon>mdi-plus-thick</v-icon>
      </v-btn>

    </td>

    <v-dialog
        v-model="isActive"
        :fullscreen="$vuetify.breakpoint.mobile"
        max-width="600"
        scrollable
    >
      <v-card rounded>
        <v-text-field
            v-model="searchString"
            filled
            rounded
            background-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            :placeholder="searchStringPlaceholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
            append-outer-icon="mdi-close"
            @click:append-outer="clickCloseSearch"
        />
        <v-divider/>
        <v-card-text class="pa-0" style="height: 80vh;">
          <filter-select-add-option
              :filter-key="filterKey"
              :filter-index="index"
              :is-open="isActive"
              :search-string="searchString"

              @close="close"
              @add="addOption"
          />
        </v-card-text>
      </v-card>
    </v-dialog>


  </filter-base>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import FilterSelectOption from "@/components/Filter/FilterSelectOption.vue";
import {makeSelectFilterValue} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import {filter} from "core-js/internals/array-iteration";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";
import FilterBase from "@/components/Filter/FilterBase.vue";

export default {
  name: "Template",
  components: {
    FilterSelectOption,
    FilterMatchMode,
    FilterSelectAddOption,
    FilterBase,


  },
  props: {
    filterKey: String,
    index: Number,
    isNew: Boolean,
  },
  data() {
    return {
      foo: 42,
      isActive: false,
      searchString: "",
      isLoading: false,
      unselectedOptions: [],
      maxUnselectedOptionsCount: 10,
      url,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    searchStringPlaceholder() {
      return "Search " + this.$pluralize(this.config.displayName, 2)
    },
    optionIds: {
      get() {
        return url.readFilterOptions(this.$route, this.entityType, this.index)
      },
      set(to) {
        console.log("set appliedOptionIds", to)
        const newValue = makeSelectFilterValue(to, "any")
        this.$emit("upsert", newValue)
      }
    },
  },

  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      console.log("FilterPhraseSelect submit()")
    },
    clickCloseSearch() {
      this.searchString ?
          this.searchString = "" :
          this.close()
    },
    onDelete() {
      console.log("FilterPhraseSelect onDelete()")
    },
    close() {
      console.log("FilterSelect close()")
      this.$store.state.activeFilterKey = null
      this.isActive = false
      this.$emit("close") // shouldn't be necessary but it is
    },
    onClickOutside() {
      console.log("FilterPhraseSelect onClickOutside()")
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }

    },

    deleteOption(id) {
      url.deleteFilterOption(this.entityType, this.index, id)
    },
    addOption(id) {
      console.log("FilterSelect addOption()", id, this.optionIds)
      this.close()
      this.optionIds.length ?
          url.addFilterOption(this.entityType, this.index, id) :
          url.createFilter(this.entityType, this.filterKey, id)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isActive(to) {
      this.searchString = ""
    }
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>