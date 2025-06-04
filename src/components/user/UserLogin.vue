<template>
  <v-dialog v-model="isOpen" max-width="500">

    <v-card v-if="!isForgotPassword" border rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title>
        <div>
          <v-icon start>mdi-account</v-icon>
          Log in
        </div>
        <v-spacer/>
        <v-btn v-if="!isFixed" icon @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <form>
          <v-text-field
              variant="filled"
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
              variant="filled"
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
        <a @click.prevent="switchToSignup" class="ml-3 text-link" href="/signup">
          Don't have an account? Sign up.
        </a>
        <v-spacer/>
        <a href="#" class="forgot-password-link text-link mr-3" @click="isForgotPassword = true">
          Forgot password?
        </a>
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
 
    <user-forgot-password v-else-if="isForgotPassword"/>
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
      const isDirty = !!this.email || !!this.password;
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
      const isValid = emailRegex.test(this.email) && this.password?.length >= 5;

      return this.isLoading || (isDirty && !isValid);
    },
    isFixed() {
      return this.$route.name == "Login";
    },
    redirectPath() {
      return this.$route.query.redirect;
    },
    isOpen: {
      get() {
        return this.isLoginDialogOpen;
      },
      set(val) {
        this.setIsLoginDialogOpen(val);
        if (!val && this.isFixed) {
          this.$router.push({ name: 'Home'});
        }
      },
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setIsLoginDialogOpen",
      "setIsSignupDialogOpen",
      "setShowPasswordResetErrorMessage",
    ]),
    ...mapActions("user", [
      "loginUser",
    ]),
    switchToSignup() {
      if (this.isFixed) {
        this.$router.push({ name: 'Signup', query: this.$route.query });
      } else {
        this.setIsSignupDialogOpen(true);
      }
    },
    async submit() {
      if (this.isFormDisabled) return false;
      this.isLoading = true;
      try {
        await this.loginUser({
          email: this.email,
          password: this.password,
        });
        if (this.redirectPath) {
          this.$router.replace(this.redirectPath);
        }
        if (this.$route.name == "ResetPassword") {
          this.$router.push({ name: 'Home'});
        }
        this.isOpen = false;
        this.snackbar(`You're logged in. Welcome back, ${this.userName}!`)
      } catch (e) {
        if (e.message.includes("404")) {
          this.isEmailUnrecognized = true;
        }
        else if (e.message.includes("403")){
          this.isPasswordWrong = true;
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
  mounted() {},
  watch: {
    isOpen() {
      this.email = "";
      this.password = "";
      this.isLoading = false;
      this.isPasswordVisible = false;
      this.isEmailUnrecognized = false;
      this.isPasswordWrong = false;
      this.isForgotPassword = this.showPasswordResetErrorMessage;
    },
    password() {
      this.isPasswordWrong = false;
    },
    email() {
      this.isEmailUnrecognized = false;
      this.password = "";
    }
  }
}
</script>

<style scoped lang="scss">
.text-link {
  text-decoration: none;
  font-size: 11px;
  color: #999;
}
.text-link:hover {
  text-decoration: underline;
}
</style>