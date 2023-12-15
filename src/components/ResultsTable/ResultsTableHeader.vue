<template>
  <th class="">
<!--    {{ config.displayName }}-->
<!--    <v-chip color="green" class="white&#45;&#45;text">-->
<!--    {{ config.displayName }}-->

<!--    </v-chip>-->

    <v-menu
        rounded
        offset-y
    >
      <template v-slot:activator="{on}">
        <v-btn text v-on="on" style="padding-left: 5px; padding-right: 5px; min-width: 0;">
<!--          <v-icon small>mdi-menu-down</v-icon>-->
          {{ config.displayName }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
            v-if="config?.actions.includes('sort')"
            @click="url.setSort( config.key)"
        >
          <v-list-item-icon>
            <v-icon>mdi-sort-ascending</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Sort by {{ config.displayName }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>


        <v-list-item
            v-if="config?.actions.includes('group_by')"
            @click="url.setGroupBy( config.key)"
        >
          <v-list-item-icon>
            <v-icon style="transform: rotate(90deg)">mdi-poll</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Count by {{ config.displayName }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
            :disabled="config.key === 'display_name'"
            @click="url.deleteActionKey('column', config.key)"
        >
          <v-list-item-icon>
            <v-icon>mdi-table-column-remove</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Remove column
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>


      </v-list>

    </v-menu>

  </th>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "ResultsTableconfigs",
  components: {},
  props: {
    config: Object,
  },
  data() {
    return {
      foo: 42,
      url,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>