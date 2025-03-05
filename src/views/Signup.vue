<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import UserSignup from "@/components/user/UserSignup.vue";

export default {
  name: "Signup",
    metaInfo() {
        return {title: "Sign up" }
    },
  components: {UserSignup},
  props: {},
  data() {
    return {}
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
    this.setIsLoginDialogOpen(false);
    this.setIsSignupDialogOpen(true);
  },
  mounted() {
    if (this.userId) {
      this.$router.push(this.$route.query.redirect || '/');
    }
  },
  beforeDestroy() {
    this.setIsSignupDialogOpen(false);
  },
  watch: {}
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>