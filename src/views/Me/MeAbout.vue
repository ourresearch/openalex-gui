<template>
  <div>
    <div class="text-h4">About Me</div>
    <v-card rounded outlined class="my-4">
      <!--          <v-divider></v-divider>-->
      <v-list color="transparent">
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-account</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ userName }}</v-list-item-title>
            <v-list-item-subtitle>Name</v-list-item-subtitle>

          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-email</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ userEmail }}</v-list-item-title>
            <v-list-item-subtitle>Email</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <div style="padding: 15px">
        <v-btn @click="logout">Log out</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script>


import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "MeAbout",
  components: {},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userName",
      "userEmail",
    ]),
  },
  methods: {
    ...mapMutations("user", [
      "logout",
    ]),
    ...mapActions("user", [
    ]),
  },
}
</script>

<style scoped lang="scss">

</style>