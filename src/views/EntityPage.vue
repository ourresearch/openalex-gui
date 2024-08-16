<template>
  <v-container>
    <v-card rounded flat class="pa-6">
    <entity :id="$route.params.namespace + '/' + $route.params.identifier" />

    </v-card>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Entity from "@/components/Entity/Entity.vue";

export default {
  name: "Template",
  components: {
    Entity,
  },
  props: {},
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