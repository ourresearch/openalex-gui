<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <v-list rounded>

          <v-list-item to="/me/labels">
            <v-list-item-content>
              <v-list-item-title>
                Labels
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item to="/me/searches">
            <v-list-item-content>
              <v-list-item-title>
                Searches
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          
          <v-list-item to="/me/corrections">
            <v-list-item-content>
              <v-list-item-title>
                Corrections
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item to="/me/about">
            <v-list-item-content>
              <v-list-item-title>
                About Me
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

        </v-list>
      </v-col>
      <v-col cols="9">
        <router-view />
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
  computed: {
  },
  methods: {
  },
  created() {
  },
  mounted() {
  },
  watch: {}
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