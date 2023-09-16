<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        Summaries
      </v-toolbar-title>
      <v-spacer/>

      <v-btn icon @click="$emit('click')">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
      <v-menu
          :close-on-content-click="false"
          v-model="isCreateMenuOpen"
      >
        <template v-slot:activator="{on}">
          <v-btn
              icon
              v-on="on"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-text-field
            hide-details
            outlined
            class="ma-1"
            prepend-inner-icon="mdi-magnify"
            clearable
            v-model="searchString"
          />
          <filter-key-selector
              :include-only-types="['select','boolean']"
              :search-string="searchString"
              dense
          />
        </v-card>
      </v-menu>


      <!--                <filter-key-selector-->
      <!--                    v-model="isCreateWidgetDialogOpen"-->
      <!--                    @close="isCreateWidgetDialogOpen = false"-->
      <!--                    hide-unpinnable-->
      <!--                    @select="createWidget"-->
      <!--                />-->


    </v-toolbar>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import YearRange from "../YearRange.vue";
import {filtersList} from "../../facetConfigs";
import {pinboard} from "../../pinboard";
import PinboardWidget from "@/components/Pinboard/PinboardWidget.vue";
import entity from "@/components/Entity/Entity.vue";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";

export default {
  name: "Pinboard",
  components: {
    YearRange,
    PinboardWidget,
    FilterKeySelector,
  },
  props: {
    widgetFilterKeys: Array
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      viewKeys: [],
      summaries: [],
      isCreateMenuOpen: false,
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
      this.$emit("remove", keyToRemove)
      // this.viewKeys = this.viewKeys.filter(vk => vk !== keyToRemove)
      // pinboard.removeView(this.entityType, keyToRemove)
    },
    addView(keyToAdd) {
      this.viewKeys.push(keyToAdd)
      pinboard.addView(this.entityType, keyToAdd)
    },
    createSummary(key) {

    },
    deleteSummary(key) {

    },


  },
  created() {
  },
  mounted() {
    // this.viewKeys = pinboard.getViews(this.entityType)
  },
  watch: {
    "$route.query.summaries": {
      immediate: true,
      handler(to, from) {
        const urlStr = (to) ? to : ""
        this.summaries = urlStr.split(",")
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>