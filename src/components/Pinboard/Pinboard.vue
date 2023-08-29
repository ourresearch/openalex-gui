<template>
  <div>
    <v-toolbar dense flat tile color="transparent">
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
            Add
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-card max-height="90vh">
          <v-text-field
              v-model="searchString"
              autofocus
              clearable
              hide-details
          />
          <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
            <v-list>
              <v-list-item
                  v-for="filter in filterOptions"
                  :key="filter.key"
                  @click="addView(filter.key)"
              >
                {{ filter.displayName }}
              </v-list-item>
            </v-list>

          </div>

        </v-card>

      </v-menu>

      <v-btn
          text
          small
          @click="pinboard.setDefault(entityType)"
      >
        Clear
      </v-btn>
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
      <v-col
          v-for="viewKey in viewKeys"
          :key="viewKey"
          cols="12"
          sm="6"
      >
        <pinboard-view
            :filter-key="viewKey"
            @remove="removeView(viewKey)"
        />

      </v-col>

    </v-row>
    <div>
    </div>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import YearRange from "../YearRange.vue";
import {filtersList} from "../../facetConfigs";
import {pinboard} from "../../pinboard";
import PinboardView from "@/components/Pinboard/PinboardView.vue";
import entity from "@/components/Entity/Entity.vue";

export default {
  name: "Pinboard",
  components: {
    YearRange,
    PinboardView,
  },
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      viewKeys: [],
      pinboard,
    }
  },
  computed: {
    entity() {
      return entity
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterOptions() {
      return filtersList(this.entityType, [], this.searchString)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    removeView(keyToRemove) {
      this.viewKeys = this.viewKeys.filter(vk => vk !== keyToRemove)
      pinboard.removeView(this.entityType, keyToRemove)
    },
    addView(keyToAdd) {
      this.viewKeys.push(keyToAdd)
      pinboard.addView(this.entityType, keyToAdd)
    }


  },
  created() {
  },
  mounted() {
    this.viewKeys = pinboard.getViews(this.entityType)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>