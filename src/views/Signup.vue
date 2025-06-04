<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import { useHead } from '@unhead/vue';

import UserSignup from "@/components/user/UserSignup.vue";

export default {
  name: "Signup",
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
    useHead({ title: 'Sign up' });
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
}
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>