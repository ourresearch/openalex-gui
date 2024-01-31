<template>

  <v-card
      :width="$vuetify.breakpoint.xsOnly ? '100%' : undefined"
      flat
      class="filter button-card filter-select d-flex align-center pa-1  ma-1"
      @click="myValue = !myValue"
  >
    <div class="pl-4  d-flex align-center py-2">
      <v-icon left>{{ config.icon }}</v-icon>
      <!--      <div>-->
      <!--        {{ entityType | pluralize(1) }} is-->
      <!--      </div>-->
    </div>
    <div>
      <!--      <div class="caption ">-->
      <!--        The {{ entityType | pluralize(1) }} is-->
      <!--        <span v-if="!myValue" class="font-weight-bold">NOT</span>-->
      <!--      </div>-->
      <div class="d-flex align-center">
        <!--        <v-chip-->
        <!--            class="mr-1"-->
        <!--            @click="myValue = !myValue"-->
        <!--            outlined-->
        <!--            label-->
        <!--        >-->
        <!--          {{ myValue ? "is" : "is NOT" }}-->
        <!--        </v-chip>-->
        <span v-if="!myValue" class="font-weight-bold mr-1">NOT</span>
        <div class="font-weight-bold">{{ config.displayName }}</div>

      </div>


    </div>
    <v-spacer/>
    <div class="px-2">
      <v-btn icon @click="$emit('delete')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>


  </v-card>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";

export default {
  name: "FilterValueSearch",
  components: {},
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,

      isDialogOpen: false,
      text: url.readFilterValue(this.$route, this.$store.state.entityType, this.filterKey),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    myValue: {
      get() {
        return url.readFilterValue(this.$route, this.entityType, this.filterKey)
      },
      set(to) {
        url.upsertFilter(
            this.entityType,
            this.filterKey,
            !!to
        )
      }

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },
    toggleValue() {

    },

  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>