<template>
  <filter-base :filter-key="filterKey" :index="index" @add-option="isActive = true">
    <div class="d-flex flex-wrap align-center">
      <template v-for="(id, i) in optionIds" :key="id">
        <filter-select-option
            class=""
            :filter-value="id"
            :filter-key="filterKey"
            :position="i"
            @delete="deleteOption(id)"
        />
        <span
            v-if="i < optionIds.length-1"
            class="mx-1 mr-2 text-grey"
        >
          or
        </span>
      </template>
    </div>

    <v-dialog
        v-model="isActive"
        :fullscreen="$vuetify.display.mobile"
        max-width="600"
        scrollable
    >
      <v-card rounded>
        <v-text-field
            v-model="searchString"
            variant="filled"
            rounded
            bg-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            :placeholder="searchStringPlaceholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
            append-icon="mdi-close"
            @click:append="clickCloseSearch"
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

import {mapGetters} from "vuex";

import {url} from "@/url";
import filters from "@/filters";
import {getFacetConfig} from "@/facetConfigs";
import {makeSelectFilterValue} from "@/filterConfigs";

import FilterSelectOption from "@/components/Filter/FilterSelectOption.vue";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";
import FilterBase from "@/components/Filter/FilterBase.vue";

export default {
  name: "FilterSelect",
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
      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    searchStringPlaceholder() {
      return "Search " + filters.pluralize(this.config.displayName, 2)
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