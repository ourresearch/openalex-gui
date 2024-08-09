<template>
  <v-container>
<!--    <v-row>-->
<!--      <div class="text-h4">-->
<!--        Profile-->
<!--      </div>-->
<!--    </v-row>-->
    <v-row>
      <v-col cols="3">
        <v-list  rounded>
          <v-list-item to="/me/about">
            <v-list-item-content>
              <v-list-item-title>
                About
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
          <v-list-item to="/me/labels">
            <v-list-item-content>
              <v-list-item-title>
                Labels
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
        </v-list>
      </v-col>
      <v-col cols="9">
        <router-view/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
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