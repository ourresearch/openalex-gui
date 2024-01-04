<template>
  <v-menu rounded max-width="400" offset-y :close-on-content-click="false" v-model="isMenuOpen">
    <template v-slot:activator="{on}">
      <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
      <v-chip
          outlined
          label
          class="font-weight-bold option"
          v-on="on"
      >
        <span class="ml-2" v-if="isNegated">NOT</span>
        <template v-if="filterDisplayValue">
          {{ filterDisplayValue | truncate(20) }}
        </template>
        <template v-else>
          loading...
        </template>
        <v-icon>mdi-menu-down</v-icon>
      </v-chip>
    </template>
    <v-card :loading="isLoading">
      <div class="pa-3 text-h6">
        {{ filterDisplayValue }}
      </div>
      <v-divider/>
      <div class="pa-4">
        <div>
          <span class="font-weight-bold">Alternate names: </span>
          <span>{{ alternateNamesString }}</span>
        </div>

      </div>

      <v-divider/>
      <v-card-actions>
        <v-spacer/>
        <v-chip
            small
            @click="toggleIsNegated"
            class="pa-0"
        >
          <v-chip
              small
              :dark="isNegated"
          >
            ≠
          </v-chip>
          <v-chip
              small
              :dark="!isNegated">
            =
          </v-chip>
        </v-chip>
        <v-btn icon
               :to="filterId | entityZoomLink"
               v-if="isEntity">
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-btn icon @click="deleteMe">
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>

      </v-card-actions>


      <!--                <v-spacer/>-->
      <!--                <v-chip-->
      <!--                    filter-->
      <!--                    :dark="isNegated"-->
      <!--                    :color="isNegated ? 'error': undefined"-->
      <!--                    class="mr-1"-->
      <!--                    :input-value="isNegated"-->
      <!--                    @click="isNegated = !isNegated"-->
      <!--                >-->
      <!--                  {{ isNegated ? "Negated" : "Negate" }}-->
      <!--                </v-chip>-->

    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";
import {url} from "@/url";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import {getEntityConfig} from "@/entityConfigs";

export default {
  name: "FilterOptionChip",
  components: {
    EditPhraseOption,
    FilterMatchMode,
  },
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
    openMenu: Boolean,
    matchMode: String,
    position: Number,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
      isMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isEntity() {
      return isOpenAlexId(this.filterValue)
    },
    filterId() {
      return this.filterValue.replace("!", "")
    },
    menuKey() {
      return this.filterKey + '-' + this.filterId
    },
    isNegated() {
      return this.filterValue[0] === "!"
    },

    alternateNamesString() {
      return [
        ...this.filterData?.display_name_alternatives ?? [],
        ...this.filterData?.display_name_acronyms ?? [],
        ...this.filterData?.alternate_titles ?? [],

      ].join("; ")
    },
  },
  asyncComputed: {
    filterDisplayValue: async function () {
      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.filterId)
      this.isLoading = false
      return resp.display_name
    },
    filterData: async function () {
      if (!this.isEntity) return {}
      this.isLoading = true
      const resp = await api.getEntity(this.filterId)
      this.isLoading = false
      return resp
    },
  },

  methods: {
    getEntityConfig,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilterOption(this.entityType, this.filterKey, this.filterValue)
    },
    toggleIsNegated() {
      url.toggleFilterOptionIsNegated(
          this.entityType,
          this.filterKey,
          this.filterValue
      )
    },
  },
  created() {
  },
  async mounted() {
    // setTimeout(()=>{
    //   if (this.$store.state.filterOptionChipOpenMenu === this.menuKey){
    // this.isMenuOpen = true
    //
    //   }
    //
    // }, 100)


  },
  watch: {}
}
</script>

<style scoped lang="scss">
.option {
  font-weight: bold;
  cursor: pointer;

  &:hover {
    //text-decoration:  underline;

  }
}

</style>