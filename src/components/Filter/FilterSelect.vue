<template>
  <v-card
      rounded
      flat
      class="filter d-flex align-center py-1 pr-2 mr-2 mb-2"
  >
    <div class="pl-4 pr-4">
      <v-icon>{{ config.icon }}</v-icon>
    </div>
    <div>
      <div class="caption mb-1">
          {{ config.displayName }} {{ !config.isVerb ? "is" : ""}}
          <filter-match-mode
              v-if="optionIds.length > 1"
              :filter-key="filterKey"
          />

        </div>

      <div class="d-flex flex-wrap">


        <filter-select-option
            class=""
            v-for="(id, i) in optionIds"
            :key="id"
            :filter-value="id"
            :filter-key="filterKey"
            :match-mode="url.readFilterMatchMode(entityType, filterKey)"
            :position="i"
            @delete="deleteOption(id)"
        />


        <v-btn class="" icon @click="$store.state.activeFilterKey = filterKey">
          <v-icon>mdi-plus</v-icon>
        </v-btn>

      </div>
    </div>



    <v-dialog rounded v-model="isActive" max-width="600">
      <v-card rounded>
        <filter-select-add-option
            @submit="submit"
            :filter-key="filterKey"
        />
        <v-divider/>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text rounded @click="isActive = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog rounded v-model="isMergeMethodPickerActive" max-width="600">
      <v-card rounded>
        <filter-select-add-option
            @submit="submit"
            :filter-key="filterKey"
        />
        <v-divider/>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text rounded @click="isActive = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



  </v-card>


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

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";

export default {
  name: "Template",
  components: {
    FilterSelectOption,
    FilterMatchMode,
    FilterSelectAddOption,

    EditPhraseOption,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      isLoading: false,
      unselectedOptions: [],
      maxUnselectedOptionsCount: 10,
      isMergeMethodPickerActive: false,

      isEditMode: false,
      url,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isActive: {
      get() {
        return this.$store.state.activeFilterKey === this.filterKey
      },
      set(to) {
        this.$store.state.activeFilterKey = (to) ?
            this.filterKey :
            undefined
      }
    },
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    isMatchModeAnd: {
      get() {
        return this.filterValue?.includes("+")
      },
      set(to) {
        const matchModeString = to ? "all" : "any"
        const newValue = makeSelectFilterValue(this.appliedOptionIds, matchModeString)
        this.$emit("upsert", newValue)
      }
    },
    optionIds: {
      get() {
        return url.readFilterOptions(this.entityType, this.filterKey)
      },
      set(to) {
        console.log("set appliedOptionIds", to)

        const isMatchModeAnd = to.some(id => id.includes("!")) ?
            true :
            this.isMatchModeAnd
        const matchModeString = isMatchModeAnd ? "all" : "any"

        const newValue = makeSelectFilterValue(to, matchModeString)
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
    onDelete() {
      console.log("FilterPhraseSelect onDelete()")

    },
    onClickOutside() {
      console.log("FilterPhraseSelect onClickOutside()")
      if (this.filterKey === this.$store.state.activeFilter) {
        this.$store.state.activeFilter = null
      }

    },

    deleteOption(id) {
      this.optionIds = this.optionIds.filter(i => i !== id)
    },
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },

    addOption(id) {
      url.addFilterOption(this.entityType, this.filterKey, id)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    optionIds: {
      immediate: true,
      handler(to, from) {
        if (!to?.length) this.isEditMode = true
      }
    }
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>