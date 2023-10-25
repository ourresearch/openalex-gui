<template>
  <v-container>
    <v-btn
        color="primary"
        rounded
        class="my-2"
        text
        @click="$router.back()"
    >
      <v-icon left>mdi-arrow-left</v-icon>
      back
    </v-btn>
    <entity :data="entityData"/>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Entity from "@/components/Entity/Entity.vue";
import {api} from "@/api";

export default {
  name: "EntityPage",
  metaInfo() {
    return {title: this.entityData?.display_name}
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
    apiPath() {
      return [
        this.$route.params.entityType,
        this.$route.params.entityId
      ].join("/")
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
  async mounted() {
    // const path = [
    //   this.$route.params.entityType,
    //   this.$route.params.entityId
    // ].join("/")
    // this.entityData = await api.get(path)
  },
  watch: {
    'apiPath': {
      immediate: true,
      async handler(to, from) {
        console.log("entityid change", this.apiPath)
        this.entityData = await api.get(this.apiPath)
      }
    }
  }
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>