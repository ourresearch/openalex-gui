<template>
  <v-container class="mt-6">
    <v-row>
      <v-col cols="2">
      </v-col>
      <v-col cols="8">
        <router-view />
      </v-col>
      <v-col cols="2">
      </v-col>
    </v-row>
  </v-container>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "MeBase",
  components: {},
  props: {},
  data() {
    return {
    }
  },
}
</script>


<style lang="scss">
.v-alert {
  font-size: 18px;
  margin: 10px;
  border-radius: 15px !important;
}
.v-alert .v-icon {
  font-size: 30px;
  margin-top: 1px;
}
</style>