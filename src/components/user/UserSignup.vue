<template>
  <v-card flat rounded :loading="isLoading" :disabled="isLoading" class="">
    <v-card-title>
      <v-icon left>mdi-account-plus</v-icon>
      Sign up
      <v-spacer/>
      <v-btn icon v-if="showCloseButton" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <p>
        Signing up for an OpenAlex account lets you create alerts and save searches.
      </p>
      <v-text-field
          filled
          rounded
          autofocus
          hide-details
          type="email"
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
          class="mt-3"
          prepend-icon="mdi-email-outline"
          v-model="email"
          placeholder="Your email"
          :messages="isEmailAlreadyInUse ? 'This email is already in use' : undefined"
      >
      </v-text-field>
      <!--        <div class="text-caption grey&#45;&#45;text ml-10">-->
      <!--          Your email is used only for login and account notifications, and is never shared.-->
      <!--        </div>-->


      <v-text-field
          hide-details
          filled
          rounded
          class="mt-4"
          prepend-icon="mdi-lock-outline"
          v-model="password"
          placeholder="Password"
          :type="isPasswordVisible ? 'text' : 'password'"
          :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="isPasswordVisible = !isPasswordVisible"
          @keydown.enter="submit"
      >
      </v-text-field>
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
      "resultsFilters",
    ]),
    isFormDisabled() {
      const isDirty = !!this.email || !!this.name || !!this.password
      const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
      const isEmailValid = emailRegex.test(this.email)
      const isNameValid = !!this.name
      const isPasswordValid = this.password?.length >= 5
      const isFormValid = isEmailValid && isNameValid && isPasswordValid

      return this.isLoading || (isDirty && !isFormValid)
    }
  },


  methods: {
    ...mapMutations([
      "snackbar",
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
        this.snackbar(`Account created. Welcome, ${this.name}!`)
        this.$emit("close")
      } catch (e) {
        if (e.message.includes("409")) {
          this.isEmailAlreadyInUse = true
        }
        console.log("user signup error: ", e)
      } finally {
        this.isLoading = false

      }
    }

  },
  created() {
  },
  mounted() {

  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>