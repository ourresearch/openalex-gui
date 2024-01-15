<template>
  <v-card rounded flat color="color-3">
    <v-toolbar dense flat color="transparent">
      <v-toolbar-title class="body-1 grey--text">
        Analytics
        ({{ groupByKeys.length }})
      </v-toolbar-title>
      <v-spacer />
      <Action class="ml-2" action="group_by"/>
    </v-toolbar>
    <v-container class="pt-0">
      <v-row dense  class="">
        <v-col
            v-for="key in groupByKeys"
            :key="key"

        >
<!--            cols="12"-->
<!--            md="6"-->
<!--            lg="4"-->
<!--            xl="3"-->
          <group-by
              :selected="key"
          />

        </v-col>

      </v-row>

    </v-container>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import GroupBy from "@/components/GroupBy/GroupBy.vue";
import Action from "@/components/Action/Action.vue";
import {url} from "@/url";

export default {
  name: "Template",
  components: {
    GroupBy,
    Action,
  },
  props: {},
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
    groupByKeys() {
      return url.getGroupBy(this.$route)
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
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>