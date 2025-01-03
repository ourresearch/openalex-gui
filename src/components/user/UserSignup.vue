<template>
  <v-dialog v-model="isOpen" max-width="500">

    <v-card flat rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title>
        <v-icon left>mdi-account-plus</v-icon>
        Sign up
        <v-spacer/>
        <v-btn icon @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p>
          Signing up for an OpenAlex account lets you create alerts and save searches.
        </p>
        <form>
          <v-text-field
              filled
              rounded
              autofocus
              hide-details

              type="text"
              name="name"
              id="name"

              class=""
              v-model="name"
              prepend-icon="mdi-account-outline"
              placeholder="Your name"
              @keyup.enter="submit"
          >
          </v-text-field>

          <v-text-field
              filled
              rounded

              type="email"
              id="email"
              name="email"

              class="mt-3"
              prepend-icon="mdi-email-outline"
              v-model="email"
              placeholder="Your email"
              :messages="emailMsg"
              :error="isEmailAlreadyInUse"
          >
          </v-text-field>
          <v-text-field
              hide-details
              filled
              rounded
              class="mt-4"
              prepend-icon="mdi-lock-outline"
              v-model="password"
              placeholder="Password"

              id="new-password"
              name="new-password"
              :type="isPasswordVisible ? 'text' : 'password'"

              :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="isPasswordVisible = !isPasswordVisible"
              @keydown.enter="submit"
          >
          </v-text-field>
        </form>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
            :disabled="isFormDisabled"
            color="primary"
            @click="submit"
            rounded
        >
          Sign up
        </v-btn>

      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "UserSignup",
  components: {},
  props: {
    showCloseButton: Boolean,
  },
  data() {
    return {
      email: "",
      name: "",
      password: "",
      isPasswordVisible: false,
      isEmailAlreadyInUse: false,

      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([

    ]),
    ...mapGetters("user", [
      "userId",
      "userName",
      "isSignupDialogOpen"
    ]),
    emailMsg() {
      return this.isEmailAlreadyInUse ?
          "Sorry, this email already has an account" :
          "Used only for login and account notifications; never shared"
    },
    isFormDisabled() {
      const isDirty = !!this.email || !!this.name || !!this.password
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isEmailValid = emailRegex.test(this.email)
      const isNameValid = !!this.name
      const isPasswordValid = this.password?.length >= 5
      const isFormValid = isEmailValid && isNameValid && isPasswordValid

      return this.isLoading || (isDirty && !isFormValid)
    },
    isOpen: {
      get() {
        return this.isSignupDialogOpen
      },
      set(val) {
        this.setIsSignupDialogOpen(val)
      },
    }
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setIsSignupDialogOpen",
    ]),
    ...mapActions("user", [
      "requestSignupEmail",
      "createUser",
    ]),
    async submit() {
      if (this.isFormDisabled) return
      this.isLoading = true
      try {
        await this.createUser({
          email: this.email,
          name: this.name,
          password: this.password
        })
        if (["Signup"].includes(this.$router.currentRoute.name)) {
          this.$router.push("/")
        }
        this.snackbar(`Account created. Welcome, ${this.name}!`)
        this.isOpen = false
      } catch (e) {
        if (e.message.includes("409")) {
          this.isEmailAlreadyInUse = true
        }
      } finally {
        this.isLoading = false
      }
    }

  },
  created() {
  },
  mounted() {

  },
  watch: {
    isOpen() {
      this.name = ""
      this.email = ""
      this.password = ""
      this.isLoading = false
      this.isPasswordVisible = false

      this.isEmailAlreadyInUse = false
    },
    password() {
    },
    email() {
      this.password = ""
      this.isEmailAlreadyInUse = false
    }
  }
}
</script>

<style scoped lang="scss">

</style>