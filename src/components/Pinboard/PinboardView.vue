<template>
  <v-card>
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
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$emit('remove')">
            <v-list-item-icon>
              <v-icon>mdi-pin-off-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Remove view
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-list dense>
      <v-list-item
        v-for="group in groups"
        :key="group.value"
      >
        <v-list-item-content>
          <v-list-item-title>
            {{ group.displayValue }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ group.count | toPrecision }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {facetConfigs} from "@/facetConfigs";
import {pinboard} from "@/pinboard";

export default {
  name: "FilterValueSelect",
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
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async fetchOptions() {
      this.isLoading = true
      const myUrl = url.makeGroupByUrl(
          this.filterKey,
          {},
      )
      try {
        const resp = await axios.get(myUrl)
        this.groups = resp.data.group_by.map(group => {
          return createDisplayFilter(
              this.entityType,
              this.filterKey,
              group.key,
              false,
              group.key_display_name,
              group.count,
          )
        })
      } catch (e) {
        console.log("fetchFilters() error:", e.message)
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