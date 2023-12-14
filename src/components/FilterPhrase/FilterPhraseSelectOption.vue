<template>
  <span>
    <v-menu offset-y open-on-hover :close-on-content-click="false" v-model="isMenuOpen">
      <template v-slot:activator="{on}">
        <span
            v-on="on"
            class=""
        >
          <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
          <template v-if="filterDisplayValue">
            <span class="font-weight-bold" style="cursor: default;">
              <span v-if="isNegated">NOT</span>
              {{ filterDisplayValue | truncate(50) }}
            </span>
          </template>
          <template v-else>
            loading...
          </template>
        </span>
      </template>
      <v-card>
        <v-card-title>
          <div>
            {{ filterDisplayValue }}
          </div>
          <v-spacer/>



        </v-card-title>
        <v-card-subtitle>
          {{ filterId }}
        </v-card-subtitle>
              <v-divider/>

              <v-card-actions>
                <v-spacer/>
                <v-btn icon @click="toggleIsNegated">
                  <v-icon>
                    {{ (isNegated) ? 'mdi-filter-outline' : 'mdi-filter-off-outline' }}
                  </v-icon>
                </v-btn>
                <v-btn icon @click="deleteMe">
                  <v-icon>mdi-delete-outline</v-icon>
                </v-btn>


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
      </v-card>
    </v-menu>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";
import {url} from "@/url";

import EditPhraseOption from "@/components/EditPhrase/EditPhraseOption.vue";

export default {
  name: "FilterOptionChip",
  components: {
    EditPhraseOption,
  },
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
    close: Boolean,
    openMenu: Boolean,
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

</style>