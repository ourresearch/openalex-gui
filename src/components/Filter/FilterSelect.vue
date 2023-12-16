<template>
  <div class="filter filter-range d-flex align-center">
    <v-icon left>{{ config.icon }}</v-icon>
    <div>
      <span>the {{ config.displayName }}</span>
      <span class="ml-2">is</span>
      <span>
        <filter-select-option
            v-for="(id, i) in optionIds"
            :key="id"
            :filter-value="id"
            :filter-key="filterKey"
            @delete="deleteOption(id)"
        />
      </span>

      <span>
        <span v-if="isEditMode">
          or
<!--          <v-text-field-->
<!--              class="text-h5 pa-0  ml-2"-->
<!--              style="display: inline-block"-->
<!--              v-model="searchString"-->
<!--              hide-details-->
<!--              autofocus-->
<!--              @keydown.enter="submit"-->
<!--              @blur="isEditMode = false"-->
<!--          />-->

          <filter-select-add-option
            @submit="submit"
            :filter-key="filterKey"
            @blur="isEditMode = false"
        />

        </span>
        <v-btn v-else icon @click="isEditMode = true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </span>
    </div>
    <v-spacer/>
    <v-btn icon @click="deleteMe">
      <v-icon>mdi-close</v-icon>
    </v-btn>


    <!--      <template v-if="optionIds.length > 1 && i < optionIds.length - 1">-->
    <!--        <filter-phrase-match-mode-->
    <!--            :filter-key="filterKey"/>-->
    <!--      </template>-->


    <!--          @toggle-is-negated="toggleOptionIsNegated(id)"-->

  </div>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import FilterSelectOption from "@/components/Filter/FilterSelectOption.vue";
import {makeSelectFilterValue} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import FilterPhraseMatchMode from "@/components/Filter/FilterMatchMode.vue";
import {filter} from "core-js/internals/array-iteration";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";

export default {
  name: "Template",
  components: {
    FilterSelectOption,
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

      isEditMode: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isActive() {
      return this.$store.state.activeFilter === this.filterKey
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
  watch: {}
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>