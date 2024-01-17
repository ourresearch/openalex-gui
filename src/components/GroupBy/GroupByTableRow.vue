<template>
  <tr @click="isSelected = !isSelected" class="group-by-table-row hover-color-1">
    <td class="pr-0" style="width: 1px; white-space: nowrap">
      <v-icon v-if="isSelected">mdi-checkbox-marked</v-icon>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </td>

    <td class="body-2">
      {{ displayValue }}
    </td>
    <td class="range body-2 text-right">
      {{ myCount | toPrecision }}
    </td>
    <td class="px-0" style="width: 1px; white-space: nowrap">
      <v-menu rounded v-model="isMenuOpen">
        <template v-slot:activator="{on}">
          <v-btn small icon v-on="on">
            <v-icon small>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list @click.stop="isMenuOpen = false">
          <v-list-item :to="value | entityZoomLink">
            <v-list-item-icon>
              <v-icon>mdi-information-outline</v-icon>
            </v-list-item-icon>
            View profile
          </v-list-item>
          <v-divider/>

          <v-list-item @click="isSelected = !isSelected">
            <v-list-item-icon>
              <v-icon>{{ isSelected ? 'mdi-filter-off-outline' : 'mdi-filter-outline' }}</v-icon>
            </v-list-item-icon>
            {{ isSelected ? 'Remove' : 'Apply' }} filter
          </v-list-item>
          <v-list-item @click="isNegated = !isNegated">
            <v-list-item-icon>
              <v-icon>mdi-filter-outline</v-icon>
            </v-list-item-icon>
            Negate filter
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
    displayValue: String,
    jason: String,
    count: Number || null,
  },
  data() {
    return {
      isMenuOpen: false,
      isNegated: false,
      foo: 42,
      myCount: this.count,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    isSelected: {
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

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async getCounts() {
      if (this?.myCount) return
      console.log("getCounts passed guard clause")

      const filters = url.upsertFilterOptionNoPush(this.entityType, this.filterKey, this.value)
      const count = await api.getResultsCount(this.entityType, filters)

      console.log("myCount results count", count)
      this.myCount = count


    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    value: {
      immediate: true,
      handler(to, from) {
        this.getCounts()
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