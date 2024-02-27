<template>
  <filter-base :filter-key="filterKey" :index="index" @click="isActive = !isActive" clickable>
    <td class="d-flex flex-wrap">
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
<!--        <span-->
<!--            :key="'or'+i"-->
<!--            v-if="i < optionIds.length-1"-->
<!--            class="mx-2"-->
<!--        >-->
<!--          or-->
<!--        </span>-->
      </template>

      <v-btn class="" icon @click="isActive = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>

    </td>


    <v-dialog scrollable :fullscreen="$vuetify.breakpoint.mobile" v-model="isActive" max-width="600">
      <filter-select-add-option
          :filter-key="filterKey"
          :filter-index="index"
          @close="isActive = false"
          @add="addOption"

      />
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
      isActive: !!this.isNew,
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
      url.deleteFilterOption(this.entityType, this.index, id)
    },
    addOption(id) {
      console.log("FilterSelect addOption()", id, this.optionIds)
      this.$emit("close") // shouldn't be necessary but it is
      this.isActive = false
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
      if (!to) this.$emit("close")
    }
  }
}
</script>

<style scoped lang="scss">
input {
  padding: 0 3px !important;
}


</style>