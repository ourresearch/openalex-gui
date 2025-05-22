<template>
  <v-card outlined rounded :loading="isLoading" :disabled="isLoading">
    <v-card-title>
      <div>
        <v-icon left>mdi-account</v-icon>
        Forgot Your Password
      </div>
      <v-spacer/>
      <v-btn icon @click="setIsLoginDialogOpen(false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <template v-if="!isSubmitted">
      <v-card-text class="error-message" v-if="showPasswordResetErrorMessage">
        Your password reset link is expired or invalid. Please request a new link.
      </v-card-text>
      <v-card-text>
        <form>
          <v-text-field
            filled
            rounded
            class="mt-0"
            name="email"
            id="email"
            type="email"
            prepend-icon="mdi-email-outline"
            v-model="email"
            hide-details
            autofocus
            placeholder="Your email"
          >
          </v-text-field>
        </form>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
        <v-btn
            :disabled="isFormDisabled"
            rounded
            color="primary"
            @click="submit"
        >
          Send Reset Link
        </v-btn>
      </v-card-actions>
    </template>
    <div class="submit-message" v-else>
      A link to reset your password has been sent to <b>{{ email }}</b>.
    </div>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserForgotPassword from "@/components/user/UserForgotPassword.vue";


export default {
  name: "UserForgotPassword",
  components: {
  },
  props: {},
  data() {
    return {
      email: "",
      isLoading: false,
      isSubmitted: false,
    }
  },
  computed: {
    ...mapGetters("user", [
      "isLoginDialogOpen",
      "showPasswordResetErrorMessage",
    ]),
    isFormDisabled() {
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isValid = emailRegex.test(this.email)

      return this.isLoading || !isValid
    },
    isOpen: {
      get() {
        return this.isLoginDialogOpen
      },
      set(val) {
        this.setIsLoginDialogOpen(val)
      },
    },
  },
  methods: {
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
    ]),
    ...mapActions("user", [
      "requestPasswordReset",
    ]),
    async submit() {
      if (this.isFormDisabled) return false
      this.isLoading = true
      try {
        await this.requestPasswordReset(this.email)
        this.isSubmitted = true
      } catch (e) {
        // For security, we ignore errors so this form can't be used to determine if an email has an account or not. 
        console.log(e)
      } finally {
        this.isLoading = false
      }
    },

  },
  created() {
  },
  mounted() {
  },
  watch: {

  }
}
</script>

<style scoped lang="scss">
.submit-message {
  font-size: 16px;
  padding: 20px;
  color: #555;
  text-align: center;
}
.error-message {
  margin-bottom: -10px;
  font-size: 16px;
  padding: 0px 55px 10px;
}
</style>