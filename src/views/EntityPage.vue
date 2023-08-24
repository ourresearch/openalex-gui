<template>
  <v-container>
    <entity :data="entityData" />
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Entity from "@/components/Entity/Entity.vue";
import {api} from "@/api";

export default {
  name: "EntityPage",
  metaInfo() {
    return "EntityPage"
    // return {title: ["Account", this.tabName].join(" ") }
  },
  components: {
    Entity,
  },
  props: {},
  data() {
    return {
      foo: 42,
      entityData: null,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "globalIsLoading",
    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
      "userEmailAlerts",
      "userSavedSearches",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  async mounted() {
    const path = [
        this.$route.params.entityType,
        this.$route.params.entityId
    ].join("/")
    this.entityData = await api.get(path)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>