<template>
  <span>
<!--    <link-entity-role-->
<!--        v-for="(role, i) in rolesToShow"-->
<!--        :key="i"-->
<!--        class="text-decoration-none"-->
<!--        :role="role"-->
<!--        :append-comma="i < rolesToShow.length - 1 "-->
<!--    />-->
    <v-menu>
      <template v-slot:activator="{on}">
        <v-btn
            text
            rounded
            class="font-weight-regular "
            v-bind="on"
        >
          <v-icon left>{{ selectedRoleConfig.icon }}</v-icon>
          {{ selectedRoleConfig.nameSingular | $capitalize }}
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
<!--          <v-subheader>{{ roles.length }} roles:</v-subheader>-->
        <v-list-item
          v-for="role in roles"
          :key="role.id"
          :to="role.id | $entityZoomLink"
        >
          <span>
            <v-icon>{{ getEntityConfig(role.role).icon }}</v-icon>
          </span>
          
            <v-list-item-title>{{ role.role }}</v-list-item-title>
          
          <span>
            <v-icon v-if="role.role === selected">mdi-check</v-icon>
          </span>


        </v-list-item>
      </v-list>
    </v-menu>

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LinkEntityRole from "@/components/LinkEntityRole.vue";
import {getEntityConfig} from "@/entityConfigs";

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
      foo: 42,
      getEntityConfig,
    }
  },
  computed: {
    ...mapGetters([

    ]),
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>
