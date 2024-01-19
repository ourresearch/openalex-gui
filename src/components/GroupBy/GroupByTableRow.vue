<template>
  <tr @click="clickRow" class="group-by-table-row hover-color-1">
    <td class="pr-0" style="width: 1px; white-space: nowrap">
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="body-2">
      <template v-if="isNegated" class="font-weight-bold">NOT </template>
        {{ myDisplayValue }}

<!--      <span class="d-inline-flex align-baseline">-->
<!--        <span v-if="isNegated" class="font-weight-bold">NOT </span>-->
<!--        <span>{{ myDisplayValue }}</span>-->
<!--      </span>-->

    </td>
    <td class="range body-2 text-right align-baseline">
      {{ myCount | toPrecision }}
    </td>
    <td class="pl-0 pr-1" style="width: 1px; white-space: nowrap">
      <v-menu rounded v-model="isMenuOpen">
        <template v-slot:activator="{on}">
          <v-btn small icon v-on="on">
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list @click.stop="isMenuOpen = false">
          <v-list-item :to="valueId | entityZoomLink">
            <v-list-item-icon>
              <v-icon>mdi-information-outline</v-icon>
            </v-list-item-icon>
            View profile
          </v-list-item>
          <v-divider/>

          <v-list-item @click="isApplied = !isApplied">
            <v-list-item-icon>
              <v-icon>{{ isApplied ? 'mdi-filter-remove-outline' : 'mdi-filter-plus-outline' }}</v-icon>
            </v-list-item-icon>
            {{ isApplied ? 'Remove from filters' : 'Apply as filter' }}
          </v-list-item>
          <v-list-item
              @click="isNegated = !isNegated"
              v-if="isApplied"
          >
            <v-list-item-icon>
              <v-icon>{{ isNegated ? 'mdi-minus-circle-off' : 'mdi-minus-circle' }}</v-icon>
            </v-list-item-icon>
            {{ isNegated ? 'Remove negation' : 'Negate filter' }}
          </v-list-item>

          <!--          <v-divider/>-->
          <!--          <v-list-item @click="isPinned = !isPinned">-->
          <!--            <v-list-item-icon>-->
          <!--              <v-icon color="">{{ isPinned ? "mdi-pin-off-outline" : "mdi-pin-outline" }}</v-icon>-->
          <!--            </v-list-item-icon>-->
          <!--            <v-list-item-content>-->
          <!--              <v-list-item-title class="">-->
          <!--                {{ isPinned ? "Unpin" : "Pin" }} view-->
          <!--              </v-list-item-title>-->
          <!--            </v-list-item-content>-->
          <!--          </v-list-item>-->
        </v-list>

      </v-menu>

    </td>
  </tr>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import {api} from "@/api";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    value: String,
    displayValue: String || null,
    count: Number || null,
  },
  data() {
    return {
      isMenuOpen: false,
      foo: 42,
      myCount: this.count,
      myDisplayValue: this.displayValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    valueId(){
      return this.value.replace("!", "")
    },
    isApplied: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        if (to) {
          url.upsertFilterOption(this.entityType, this.filterKey, this.value)
        } else {
          url.deleteFilterOption(this.entityType, this.filterKey, this.value)
        }
      }
    },
    isNegated: {
      get() {
        return this.value.indexOf("!") === 0
      },
      set(to) {
        url.setFilterOptionIsNegated(this.entityType, this.filterKey, this.value, to)
      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickRow(){
      return this.isNegated ?
          this.isNegated = false :
          this.isApplied = !this.isApplied
    },
    async getMyCount() {
      if (this?.myCount) return

      const filters = url.upsertFilterOptionNoPush(this.entityType, this.filterKey, this.value)
      const count = await api.getResultsCount(this.entityType, filters)

      console.log("myCount results count", count)
      this.myCount = count
    },
    async getMyDisplayValue() {
      if (this?.myDisplayValue) return // no need to get it it we've got it already
      this.myDisplayValue =  await api.getFilterValueDisplayName(this.filterKey, this.valueId)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    value: {
      immediate: true,
      handler(to, from) {
        this.getMyCount()
        this.getMyDisplayValue()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.group-by-table-row {
  cursor: pointer;

  &:hover {
    //background: $color-2;
  }
}

</style>