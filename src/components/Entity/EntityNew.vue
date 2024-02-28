<template>
  <v-card flat rounded v-if="data" class="py-4">
    <template
        v-for="(filterKey, i) in myEntityConfig.rowsToShowOnEntityPage"
    >
      <v-divider
          v-if="filterKey === null"
          :key="'divider-'+i"
          class="my-1"
      />
      <entity-datum-row
          v-else
          :key="'data-'+filterKey"
          :filter-key="filterKey"
          :data="data"
          :type="type"
          class="px-4 pb-1"
      />
    </template>


  </v-card>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import {getEntityConfig} from "@/entityConfigs";
import EntityDatumRow from "@/components/Entity/EntityDatumRow.vue";
import {filter} from "core-js/internals/array-iteration";
import WorkLinkouts from "@/components/WorkLinkouts.vue";


export default {
  name: "Template",
  components: {
    WorkLinkouts,
    LinkEntityRolesList,
    EntityDatumRow,
  },
  props: {
    data: Object,
    type: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    myEntityConfig() {
      return getEntityConfig(this.type)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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