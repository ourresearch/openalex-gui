<template>
  <span>
<!--    <link-entity-role-->
<!--        v-for="(role, i) in rolesToShow"-->
<!--        :key="i"-->
<!--        class="text-decoration-none"-->
<!--        :role="role"-->
<!--        :append-comma="i < rolesToShow.length - 1 "-->
<!--    />-->
    <v-btn
        text
        rounded
        class="mr-3 capitalize-first-letter"
        v-for="(role, i) in rolesToShow"
        :key="i"
        :to="role.id | entityZoomLink"
    >
      {{role.role | capitalize }}
    </v-btn>

  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import LinkEntityRole from "@/components/LinkEntityRole.vue";

export default {
  name: "LinkEntityRolesList",
  components: {
    LinkEntityRole
  },
  props: {
    roles: Array,
    hideRole: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    rolesToShow() {
      return this.roles.filter(r => {
        return r.role !== this.hideRole
      })
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