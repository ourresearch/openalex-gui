<template>
  <v-card flat tile class="">
    <v-list class="flex-grow-1">
      <v-list-item
          v-for="group in groups"
          :key="group.value"
          style="min-height: unset;"
          @click="url.createFilter(entityType, filterKey, group.value)"
      >
        <v-list-item-icon>
          <!--          <div class="d-flex" style="background: #eee; height: 100%;  min-width: 50px;">-->
          <!--            <v-spacer/>-->
          <!--            <div class="d-flex" :style="`background: #999; height: 100%; width: ${group.countScaled * 100}%;`"></div>-->
          <!--          </div>-->
          <v-progress-circular
              width="7"
              size="22"
              :value="group.countScaled * 100"
              rotate="-90"
          />

        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="font-weight-regular">
            {{ group.displayValue }}
          </v-list-item-title>
                    <v-list-item-subtitle>
                       {{group.count | toPrecision }}
                    </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action-text>
          <span>
            {{ group.count | toPrecision }}
          </span>
        </v-list-item-action-text>
      </v-list-item>
<!--      <v-list-item v-if="groups.length >= 5" key="viewmore">-->
<!--        <v-list-item-icon>-->
<!--          <v-icon>mdi-dots-horizontal</v-icon>-->
<!--        </v-list-item-icon>-->
<!--        <v-list-item-content>-->
<!--          <v-list-item-title class="font-weight-regular">-->
<!--            view more-->
<!--          </v-list-item-title>-->
<!--        </v-list-item-content>-->

<!--      </v-list-item>-->
    </v-list>

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "../../url";
import {facetConfigs} from "@/facetConfigs";
import {filtersFromUrlStr} from "../../filterConfigs";

export default {
  name: "GroupBy",
  components: {},
  props: {
  },
  data() {
    return {
      url,
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.filterKey)
    },
    filterKey(){
      return this.$route.query.group_by
    },
    apiUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
          }
      )
    },
    csvUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
            formatCsv: true,
          }
      )
    }
  },
  asyncComputed: {
    async groups(){
      this.isLoading = true
      const filters = filtersFromUrlStr(this.$route.query.filter)
      return  await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            perPage: 200,
            hideUnknown: true,
            filters: filters,
          }
      )
      this.isLoading = false
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setApiDialogUrl",
    ]),
    ...mapActions([]),
    async fetchOptions() {
      this.isLoading = true
      const filters = filtersFromUrlStr(this.$route.query.filter)
      this.groups = await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            perPage: 200,
            hideUnknown: true,
            filters: filters,
          }
      )
      this.isLoading = false
    }


  },
  created() {
  },
  mounted() {

  },
  watch: {

  }
}
</script>

<style scoped lang="scss">

</style>