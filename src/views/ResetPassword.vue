<template>
  <v-container class="fill-height justify-center">

    <v-card flat rounded v-if="!isSubmitted" style="width: 500px;">
      <v-card-title class="text-h5">
        Reset Your Password
      </v-card-title>
      <v-card-text>
        <form>
          <v-text-field
            filled
            rounded
            class="mt-0"
            name="password"
            id="password"
            type="password"
            prepend-icon="mdi-lock-outline"
            v-model="password"
            autofocus
            placeholder="New Password"
          >
          </v-text-field>
        </form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
            :disabled="this.password.length < 5"
            rounded
            color="primary"
            class="reset-btn"
            @click="submit"
        >
          Reset Password
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card flat rounded v-else-if="isSubmitted">
      <v-card-text class="text-h6">
        Your password has been reset.
      </v-card-text>
      <v-card-actions class="d-flex justify-center">
        <v-btn
            rounded
            color="primary"
            @click="setIsLoginDialogOpen(true)"
        >
          Log in
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import { useHead } from '@unhead/vue';

export default {
  name: "ResetPassword",
  components: {},
  props: {},
  data() {
    return {
      token: null,
      password: "",
      isSubmitted: false
    }
  },
  computed: {
  },
  methods: {
    ...mapMutations("user", [
      "setShowPasswordResetErrorMessage",
      "setIsLoginDialogOpen",
    ]),
    ...mapActions("user", [
      "resetPassword"
    ]),
    async submit() {
      console.log("user.store resetPassword submit");
      try {
        await this.resetPassword({password: this.password, token: this.token});
        this.isSubmitted = true;
      } catch (e) {
        console.log("user.store resetPassword error", e);
        this.setShowPasswordResetErrorMessage(true);
        this.setIsLoginDialogOpen(true);
      }
    },
  },
  created() {
    useHead({ title: 'Reset Password' });
  },
  mounted() {
    this.token = this.$route.query.token;
  },
  beforeDestroy() {
    this.setShowPasswordResetErrorMessage(false);
  }
}
</script>


<style scoped lang="scss">
.v-btn.reset-btn {
  margin-top: -45px;
  margin-right: 10px;
}
</style>