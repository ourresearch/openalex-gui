<template>
  <div class="color-2 py-12">
    <v-container>
      <v-row>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/main">
            <v-card-title>
              Main
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/landing_page">
            <v-card-title>
              Landing Page
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/all_columns">
            <v-card-title>
              All Columns
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/disjunctions">
            <v-card-title>
              Disjunctions
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="clickable" rounded flat to="/tests/labels">
            <v-card-title>
              Labels
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "TestQueriesSuitesList",
}
</script>


<style scoped lang="scss">

</style>