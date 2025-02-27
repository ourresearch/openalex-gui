<template>
  <v-dialog v-model="isOpen" max-width="500">

    <v-card v-if="!isForgotPassword" outlined rounded :loading="isLoading" :disabled="isLoading">
      <v-card-title>
        <div>
          <v-icon left>mdi-account</v-icon>
          Log in
        </div>
        <v-spacer/>
        <v-btn icon @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <!--      <v-divider></v-divider>-->
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
              autofocus
              placeholder="Your email"
              :messages="isEmailUnrecognized ? 'Email not found' : undefined"
              :error="isEmailUnrecognized"
              :hide-details="!isEmailUnrecognized"
          >
          </v-text-field>
          <v-text-field
              filled
              rounded
              class="mt-3"
              prepend-icon="mdi-lock-outline"
              v-model="password"
              placeholder="Password"

              name="current-password"
              id="current-password"
              :type="isPasswordVisible ? 'text' : 'password'"

              :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="isPasswordVisible = !isPasswordVisible"

              :messages="isPasswordWrong ? 'Wrong password' : undefined"
              :error="isPasswordWrong"
              :hide-details="!isPasswordWrong"

              @keyup.enter="submit"
          >
          </v-text-field>
        </form>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <div class="forgot-password-link" @click="isForgotPassword = true">
          Forgot your password?
        </div>
        <v-btn
            :disabled="isFormDisabled"
            rounded
            color="primary"
            @click="submit"
        >
          Log in
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-else-if="isForgotPassword">
      <user-forgot-password />
    </v-card>
  </v-dialog>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import UserForgotPassword from "@/components/user/UserForgotPassword.vue";


export default {
  name: "UserLogin",
  components: {
    UserForgotPassword,
  },
  props: {},
  data() {
    return {
      email: "",
      password: "",
      isPasswordVisible: false,
      isLoading: false,
      isEmailUnrecognized: false,
      isPasswordWrong: false,
      isForgotPassword: false,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userName",
      "isLoginDialogOpen",
      "showPasswordResetErrorMessage",
    ]),
    isFormDisabled() {
      const isDirty = !!this.email || !!this.password
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isValid = emailRegex.test(this.email) && this.password?.length >= 5

      return this.isLoading || (isDirty && !isValid)
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
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
      "setShowPasswordResetErrorMessage",
    ]),
    ...mapActions("user", [
      "loginUser",
    ]),
    async submit() {
      if (this.isFormDisabled) return false
      this.isLoading = true
      try {
        await this.loginUser({
          email: this.email,
          password: this.password,
        })
        this.isOpen = false
        if (["Login", "ResetPassword"].includes(this.$router.currentRoute.name)) {
          this.$router.push("/")
        }

        this.snackbar(`You're logged in. Welcome back, ${this.userName}!`)
      } catch (e) {
        if (e.message.includes("404")) {
          this.isEmailUnrecognized = true
        }
        else if (e.message.includes("403")){
          this.isPasswordWrong = true
        }
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
    isOpen(to, from) {
      this.email = ""
      this.password = ""
      this.isLoading = false
      this.isPasswordVisible = false

      this.isEmailUnrecognized = false
      this.isPasswordWrong = false

      this.isForgotPassword = this.showPasswordResetErrorMessage
      this.setShowPasswordResetErrorMessage(false)
    },
    password(){
      this.isPasswordWrong = false
    },
    email() {
      this.isEmailUnrecognized = false
      this.password = ""
    }
  }
}
</script>

<style scoped lang="scss">
.forgot-password-link {
  font-size: 13px;
  color: #555;
  margin-right: 15px;
}
.forgot-password-link:hover {
  cursor: pointer;
}
</style>