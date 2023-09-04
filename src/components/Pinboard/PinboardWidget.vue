<template>
  <v-card flat class="">
    <v-toolbar dense flat>
      <v-toolbar-title>
        <v-icon left>{{ myFilterConfig.icon }}</v-icon>
        <span v-if="groups.length >= 5">
          Top {{ myFilterConfig.displayName | pluralize(2) }}
        </span>
        <span v-else>
          {{ myFilterConfig.displayName }}
        </span>
      </v-toolbar-title>
      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn
              icon
              v-on="on"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$emit('delete')">
            <v-list-item-icon>
              <v-icon>mdi-pin-off-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Unpin
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              @click="setApiDialogUrl(apiUrl)"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              View in API
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-list dense class="flex-grow-1">
      <v-list-item
          v-for="group in groups"
          :key="group.value"
          style="min-height: unset;"
      >
        <v-list-item-icon>
<!--          <div class="d-flex" style="background: #eee; height: 100%;  min-width: 50px;">-->
<!--            <v-spacer/>-->
<!--            <div class="d-flex" :style="`background: #999; height: 100%; width: ${group.countScaled * 100}%;`"></div>-->
<!--          </div>-->
          <v-progress-circular
            width="9"
            :value="group.countScaled * 100"
            rotate="-90"
          />

        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title >
            {{ group.displayValue }}
          </v-list-item-title>
          <v-list-item-subtitle>
             {{group.count | toPrecision }}
          </v-list-item-subtitle>
        </v-list-item-content>
<!--        <v-list-item-action-text>-->
<!--          <span>-->
<!--            {{ group.count | millify }}-->
<!--          </span>-->
<!--        </v-list-item-action-text>-->
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "../../url";
import {facetConfigs} from "@/facetConfigs";
import {pinboard} from "@/pinboard";

export default {
  name: "PinboardWidget",
  components: {},
  props: {
    filterKey: String,
    filters: Array,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      groups: [],
      searchString: "",
      pinboard,
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
    apiUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
          }
      )
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
      try {
        this.groups = await api.getGroups(
            this.entityType,
            this.filterKey,
            {
              perPage: 6,
              hideUnknown: true,
              filters: this.filters,
            }
        )
      } catch (e) {
        console.log("PinboardView fetchOptions() error:", e.message)
      } finally {
        this.isLoading = false
      }
    }


  },
  created() {
  },
  mounted() {

  },
  watch: {
    filters: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    }

  }
}
</script>

<style scoped lang="scss">

</style>