<template>
  <div>
    <span>
      {{ myFilterConfig.displayName }}:
    </span>
    <span @click="isDialogOpen=true">
    <q>{{ text }}</q>

    </span>
    <v-dialog
        v-model="isDialogOpen"
        max-width="400"
        scrollable
    >
      <v-card rounded flat>
        <v-toolbar flat>
          <v-toolbar-title>
            <v-icon left>mdi-filter-outline</v-icon>
            {{ myFilterConfig.displayName }}
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="isDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text class="pt-4">

          <v-text-field
            autofocus
            rounded
            clearable
            outlined
            v-model="text"
            placeholder="Search"
            hide-details
            prepend-inner-icon="mdi-magnify"
            @keyup.enter="submit"
        />
        </v-card-text>
      </v-card>

    </v-dialog>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import FilterEditSearch from "@/components/FilterEdit/FilterEditSearch.vue";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";

export default {
  name: "FilterValueSearch",
  components: {
    FilterEditRange,
    FilterEditSearch,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,

      isDialogOpen: false,
      text: url.readFilterValue(this.$store.state.entityType, this.filterKey),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      url.upsertFilter(
            this.entityType,
            this.filterKey,
            this.text
        )
    }

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