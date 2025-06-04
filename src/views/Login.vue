<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import { useHead } from '@unhead/vue';

export default {
  name: "Login",
  components: {},
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
    useHead({ title: 'Log in to OpenAlex' });
    console.log("Login setting both flags");
    this.setIsLoginDialogOpen(true);
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