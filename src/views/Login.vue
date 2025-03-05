<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import UserLogin from "@/components/user/UserLogin.vue";

export default {
  name: "Login",
    metaInfo() {
        return {title: "Log in" }
    },
  components: {UserLogin},
  props: {},
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
  },
  methods: {
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
      "setIsSignupDialogOpen",
    ]),
  },
  created() {
    this.setIsLoginDialogOpen(true);
    this.setIsSignupDialogOpen(false);
  },
  mounted() {
    if (this.userId) {
      this.$router.push(this.$route.query.redirect || '/');
    }
  },
  beforeDestroy() {
    this.setIsLoginDialogOpen(false);
  },
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>