<template>
  <v-card rounded flat>
    <v-toolbar dense flat>
      <v-toolbar-title>
        Count works by:
      </v-toolbar-title>
      <v-spacer/>
      <action class="" action="group_by"/>
    </v-toolbar>
    <v-divider/>
    <v-row class="pt-4">
      <v-col
          v-for="key in groupByKeys"
          :key="key"
          cols="4"
      >
        <group-by
            :selected="key"
        />

      </v-col>

    </v-row>
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