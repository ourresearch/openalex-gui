<template>
  <v-menu offset-x :close-on-content-click="false">
    <template v-slot:activator="{on}">
      <v-list-item v-on="on">

        <v-list-item-icon>
          <v-icon class="mt-3">{{ myFilterConfig.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            <span v-if="myFilterValue">
              <v-icon >mdi-toggle-switch-outline</v-icon>
              True
            </span>
            <span v-else>
              <v-icon >mdi-toggle-switch-off-outline</v-icon>
              False
            </span>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ myFilterConfig.displayName }}
<!--            {{ myFilterConfig.type }}-->
          </v-list-item-subtitle>

          <!--      <v-switch-->
          <!--          :label="myFilterConfig.displayName"-->
          <!--            :disabled="disabled"-->
          <!--            class="ma-0 pt-0 pl-3"-->
          <!--            v-model="myFilterValue"-->
          <!--            hide-details-->
          <!--            @change="$emit('update', myFilterValue)"-->

          <!--        />-->

        </v-list-item-content>
        <!--    <v-list-item-action>-->
        <!--      <v-switch-->

        <!--            :disabled="disabled"-->
        <!--            class="ma-0 pt-1"-->
        <!--            v-model="myFilterValue"-->
        <!--            hide-details-->
        <!--            @change="$emit('update', myFilterValue)"-->
        <!--            -->
        <!--        />-->
        <!--    </v-list-item-action>-->
        <v-list-item-action>


          <v-btn icon @click="$emit('delete', filterKey)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </template>
    <filter-edit-boolean
        :filter-key="filterKey"
        :filter-value="filterValue"
        @update="(newValue) =>  $emit('update', newValue)"
    />
  </v-menu>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {getFacetConfig} from "@/facetConfigs";
import FilterEditBoolean from "@/components/FilterEdit/FilterEditBoolean.vue";

export default {
  name: "FilterValueBoolean",
  components: {
    FilterEditBoolean,
  },
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: [Boolean, String],
  },
  data() {
    return {
      foo: 42,
      options: [],
      myFilterValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    label() {
      const negationString = (this.myFilterValue) ? "" : "NOT"
      return `${negationString} ${this.myFilterConfig.displayName}`
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  async mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>