<template>
  <v-container class="fill-height justify-center">
    <user-signup class=""  style="max-width: 400px" />
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserLogin from "@/components/user/UserLogin.vue";
import UserSignup from "@/components/user/UserSignup.vue";

export default {
  name: "Login",
    metaInfo() {
        return {title: "Sign up" }
    },
  components: {UserSignup},
  props: {},
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
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
  mounted() {
    if (this.userId) {
      this.$router.push("/me")
    }
  },
  watch: {}
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>