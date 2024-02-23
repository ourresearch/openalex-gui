<template>
  <div v-if="data">

    <div class="text-h4 my-2">
      {{ $prettyTitle(data.display_name) }}
    </div>
    <div class="d-flex align-center">
      <link-entity-roles-list
          v-if="data.roles"
          :roles="data.roles"
          :selected="myEntityConfig.nameSingular"
          style="margin-left:-13px;"
      />
      <div v-else-if="type !== 'works'" class="">
        {{ myEntityConfig.displayNameSingular | capitalize }}
      </div>
      <work-linkouts v-if="type === 'works'" :data="data"/>
    </div>
    <div class="mt-10">
      <entity-datum-row
          v-for="filterKey in myEntityConfig.rowsToShowOnEntityPage"
          :key="filterKey"
          :filter-key="filterKey"
          :data="data"
      />

    </div>


  </div>

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