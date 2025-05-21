<template>
  <div v-if="data">
    <template
        v-for="(filterKey, i) in rowsToShow"
    >
      <v-divider
          v-if="filterKey === null"
          :key="'divider-'+i"
          class="ma-3"
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
  </div>
</template>


<script>

import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import {getEntityConfig} from "@/entityConfigs";
import EntityDatumRow from "@/components/Entity/EntityDatumRow.vue";
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import {entityTypeFromId} from "@/util";


export default {
  name: "EntityNew",
  components: {
    WorkLinkouts,
    LinkEntityRolesList,
    EntityDatumRow,
  },
  props: {
    data: Object,
  },
  computed: {
    myEntityConfig() {
      return getEntityConfig(this.type)
    },
    type(){
      return entityTypeFromId(this.data.id)
    },
    rowsToShow() {
      // Remove initial nulls
      let rows = this.myEntityConfig.rowsToShowOnEntityPage;
      while (rows[0] === null) {
        rows.shift();
      }
      return rows;
    }
  },
}
</script>


<style scoped lang="scss">

</style>