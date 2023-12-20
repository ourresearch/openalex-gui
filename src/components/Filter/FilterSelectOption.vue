<template>
  <span>
    <filter-match-mode
        v-if="position > 0"
        :filter-key="filterKey"
    />
    <v-menu rounded max-width="200" offset-y :close-on-content-click="false" v-model="isMenuOpen">
      <template v-slot:activator="{on}">
        <span
            v-on="on"
            class=""
        >
          <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
          <template v-if="filterDisplayValue">
            <span class="font-weight-bold option">
              <span class="ml-2" v-if="isNegated">NOT</span>
              {{ filterDisplayValue | truncate(100) }}
              <v-icon>mdi-menu-down</v-icon>
            </span>
          </template>
          <template v-else>
            loading...
          </template>
        </span>
      </template>
      <v-list >

        <v-subheader>
          OpenAlex:{{ filterId }}
        </v-subheader>
        <v-divider />
        <v-list-item @click="toggleIsNegated">
          <v-list-item-content>
            {{ isNegated ? "Un-negate" : "Negate" }}
          </v-list-item-content>
        </v-list-item>
        <v-list-item  @click="deleteMe">
          <v-list-item-content>
            Delete

          </v-list-item-content>
        </v-list-item>


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

              </v-card-actions>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";
import {url} from "@/url";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";
import FilterMatchMode from "@/components/Filter/FilterMatchMode.vue";

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
    }
  },
  asyncComputed: {
    filterDisplayValue: async function () {
      // if (!this.isEntity) return this.filterValue

      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.filterId)
      this.isLoading = false
      return resp.display_name
    },
  },

  methods: {
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
  cursor:pointer;
  &:hover {
    text-decoration:  underline;

  }
}

</style>