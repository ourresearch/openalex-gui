<template>
  <v-menu  rounded :close-on-content-click="false" v-model="isMenuOpen">
    <template v-slot:activator="{on}">
      <v-chip
          close
          outlined
          @click:close="$emit('delete')"
          v-on="on"
          class="mr-1 mb-1"
      >

        <!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
        <template v-if="filterDisplayValue">
          <span class="mr-1 font-weight-bold error--text" v-if="isNegated">NOT</span>
          {{ filterDisplayValue | truncate(50) }}
        </template>
        <template v-else>
          Loading...
        </template>
      </v-chip>
    </template>
    <v-card rounded>
      <v-card-title>

        {{ filterDisplayValue }}

      </v-card-title>
      <v-card-subtitle>
        {{ filterId }}
      </v-card-subtitle>
      <v-divider/>
      <v-card-actions>
        <v-spacer/>
        <v-btn
            v-if="isEntity"
            text
            rounded
        >
          <v-icon left>mdi-information-outline</v-icon>
          Learn more
        </v-btn>
        <v-chip
            filter
            :dark="isNegated"
            :color="isNegated ? 'error': undefined"
            class="mr-1"
            :input-value="isNegated"
            @click="isNegated = !isNegated"
        >
          {{ isNegated ? "Negated" : "Negate" }}
        </v-chip>

      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "@/url";
import {isOpenAlexId} from "@/util";

export default {
  name: "FilterOptionChip",
  components: {},
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
    menuKey(){
      return this.filterKey + '-' + this.filterId
    },
    isNegated: {
      get() {
        return this.filterValue[0] === "!"
      },
      set(to) {
        // this.$store.state.filterOptionChipOpenMenu = this.menuKey
        this.$emit('toggle-is-negated')
        // this.$nextTick(()=>{
        // this.isMenuOpen = true
        //
        // })
      }
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
    delete(){
      url.deleteFilterOption(this.entityType, this.filterKey, this.filterValue)
    }


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
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>