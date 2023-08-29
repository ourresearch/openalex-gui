<template>
  <div>
    <v-toolbar dense flat tile color="transparent">
      <v-toolbar-title>
        Analytic views
      </v-toolbar-title>
      <v-spacer/>
      <v-menu
               max-height="90vh"
      >
        <template v-slot:activator="{on}">
          <v-btn
                  text
                  small
                  v-on="on"
          >
            Add view
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
          <v-card max-height="90vh">
            <v-text-field
                    v-model="searchString"
                    @click.stop="doIt"
                    autofocus
                    clearable
                    hide-details
            />
            <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
              <v-list>
                <v-list-item
                  v-for="filter in filterOptions"
                  :key="filter.key"
                  @click="doIt"
                >
                  {{ filter.displayName }}
                </v-list-item>
              </v-list>

            </div>

          </v-card>

      </v-menu>
    </v-toolbar>
    <v-divider class="mb-3"/>
    <v-row>
      <v-col cols="6">
        <year-range
                height="50px"
                big
                class="mb-3"
                show-filter-link
        />

      </v-col>
      <v-col cols="6">
        <year-range
                height="50px"
                big
                class="mb-3"
                show-filter-link
        />

      </v-col>
    </v-row>
    <div>
      <div>pins</div>
      {{ pinboard.getViews(entityType) }}
    </div>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import YearRange from "../YearRange.vue";
import {filtersList} from "../../facetConfigs";
import {pinboard} from "../../pinboard";

export default {
    name: "Pinboard",
    components: {
        YearRange,
    },
    props: {},
    data() {
        return {
            foo: 42,
            searchString: "",
            pinboard,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
        ]),
        filterOptions(){
            return filtersList(this.entityType, [], this.searchString)
        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
        ]),
        ...mapActions([]),
        doIt(){

        }


    },
    created() {
    },
    mounted() {
    },
    watch: {}
}
</script>

<style scoped lang="scss">

</style>