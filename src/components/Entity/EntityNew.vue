<template>
  <div v-if="data">

    <div
        class="text-h4 mb-1"
        v-html="$prettyTitle(data.display_name)"
    />
    <div class="d-flex align-center">
      <link-entity-roles-list
          v-if="data.roles"
          :roles="data.roles"
          :selected="myEntityConfig.nameSingular"
          style="margin-left:-13px;"
      />
      <div v-else-if="type !== 'works'" class="grey--text">
        {{ myEntityConfig.displayNameSingular | capitalize }}
      </div>
      <work-linkouts v-if="type === 'works'" :data="data"/>
    </div>
    <div class="mt-10">
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
        />
      </template>

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