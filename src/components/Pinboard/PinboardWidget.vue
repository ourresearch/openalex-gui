<template>
  <v-card flat class="">
    <v-toolbar dense flat>
      <v-toolbar-title>
        <v-icon>mdi-pin-outline</v-icon>
        {{ myFilterConfig.displayName }}
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
          <v-list-item @click="$emit('remove')">
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
        <div class="flex-grow-1">
          <div style="font-size: 13px">
            {{ group.displayValue }} ({{group.count | millify }})
          </div>
        </div>
        <div class="d-flex" style="background: #eee; height: 20px;  min-width: 150px;">
          <div class="d-flex" :style="`background: #999; height: 100%; width: ${group.countScaled * 100}%;`"></div>
          <v-spacer/>
        </div>
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
    searchString: {
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