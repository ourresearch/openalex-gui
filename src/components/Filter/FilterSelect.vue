<template>
  <v-card
      :width="$vuetify.breakpoint.xsOnly ? '100%' : undefined"
      flat
      class="filter no-hover button-card filter-select d-block d-sm-flex align-center px-1  ma-1"
  >
    <div class="pl-4 pr-2 d-flex align-center py-1">
      <v-icon left>{{ config.icon }}</v-icon>
      <div>
        {{ config.displayName }}:
      </div>
      <v-spacer></v-spacer>
      <v-btn icon small v-if="$vuetify.breakpoint.xsOnly">
        <v-icon >mdi-close</v-icon>
      </v-btn>
    </div>
    <!--      <div class="caption mb-1">-->
    <!--        {{ config.displayName }} {{ !config.isVerb ? "is" : "" }}-->
    <!--      </div>-->

    <div class="d-flex flex-wrap align-center px-3 px-sm-0">
      <!--           style="margin-left: -11px;"-->


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
            :key="'matchmode'+i"
            v-if="i < optionIds.length-1"
            class="mr-1"
        >
            <filter-match-mode
                :filter-key="filterKey"
            />
          </span>

      </template>


      <v-btn class="" icon @click="$store.state.activeFilterKey = filterKey">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

    </div>


    <v-dialog scrollable :fullscreen="$vuetify.breakpoint.mobile" v-model="isActive" max-width="600">
      <filter-select-edit
          :filter-key="filterKey"
          @close="isActive = false"
      />
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
import FilterSelectEdit from "@/components/Filter/FilterSelectEdit.vue";

export default {
  name: "Template",
  components: {
    FilterSelectOption,
    FilterMatchMode,

    FilterSelectEdit,


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
        return url.readFilterOptions(this.$route, this.entityType, this.filterKey)
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