<template>
  <span>
    <v-menu>
      <template v-slot:activator="{on}">
        <v-btn
            text
            rounded
            class="font-weight-regular "
            v-on="on"
        >
          <v-icon left>{{ selectedRoleConfig.icon }}</v-icon>
          {{ filters.capitalize(selectedRoleConfig.nameSingular) }}
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="role in roles"
          :key="role.id"
          :to="filters.entityZoomLink(role.id)"
        >
          <v-list-item-icon>
            <v-icon>{{ getEntityConfig(role.role).icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ role.role }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon v-if="role.role === selected">mdi-check</v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import filters from "@/filters";
import {getEntityConfig} from "@/entityConfigs";
import LinkEntityRole from "@/components/LinkEntityRole.vue";

export default {
  name: "LinkEntityRolesList",
  components: {
    LinkEntityRole
  },
  props: {
    roles: Array,
    hideRole: String,
    selected: String,
  },
  data() {
    return {
      filters,
      getEntityConfig,
    }
  },
  computed: {
    rolesToShow() {
      return this.roles.filter(r => {
        return r.role !== this.hideRole
      })
    },
    selectedRoleConfig(){
      return getEntityConfig(this.selected)
    }
  },
  methods: {
  },
}
</script>

<style scoped lang="scss">

</style>