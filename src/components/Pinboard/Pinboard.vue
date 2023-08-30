<template>
  <div>
    <v-row dense>
      <v-col cols="6">
        <year-range
            height="50px"
            big
            class="mb-3"
            show-filter-link
        />

      </v-col>
      <v-col
          v-for="viewKey in widgetFilterKeys"
          :key="viewKey"
          cols="12"
          sm="6"
      >
        <pinboard-widget
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
import PinboardWidget from "@/components/Pinboard/PinboardWidget.vue";
import entity from "@/components/Entity/Entity.vue";

export default {
  name: "Pinboard",
  components: {
    YearRange,
    PinboardWidget,
  },
  props: {
      widgetFilterKeys: Array
  },
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
        this.$emit("remove", keyToRemove)
      // this.viewKeys = this.viewKeys.filter(vk => vk !== keyToRemove)
      // pinboard.removeView(this.entityType, keyToRemove)
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