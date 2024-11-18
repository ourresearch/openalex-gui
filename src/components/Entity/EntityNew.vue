<template>
  <div v-if="data" class="">
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


  </div>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LinkEntityRolesList from "@/components/LinkEntityRolesList.vue";
import {getEntityConfig} from "@/entityConfigs";
import EntityDatumRow from "@/components/Entity/EntityDatumRow.vue";
import WorkLinkouts from "@/components/WorkLinkouts.vue";
import {entityTypeFromId} from "@/util";


export default {
  name: "Template",
  components: {
    WorkLinkouts,
    LinkEntityRolesList,
    EntityDatumRow,
  },
  props: {
    data: Object,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    myEntityConfig() {
      return getEntityConfig(this.type)
    },
    type(){
      return entityTypeFromId(this.data.id)
    }
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
