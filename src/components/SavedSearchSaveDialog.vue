<template>
  <v-dialog v-model="myIsOpen" max-width="500">
      <v-card :loading="isLoading" :disabled="isLoading" v-if="userId" flat rounded>
        <v-card-title>{{ myHasAlert ? "Create Alert" : "Save Search" }}</v-card-title>
        <v-card-subtitle v-if="myHasAlert">
          Save this search and subscribe to alerts
        </v-card-subtitle>
        <div class="pa-4 pb-0">
          <v-text-field
              autofocus
              rounded
              variant="solo-filled"
              flat
              clearable
              placeholder="Name (required)"
              v-model="nameString"
              @keydown.enter="save"
              counter="25"
          />
          <v-textarea
              rounded
              variant="solo-filled"
              flat
              placeholder="Description (optional)"
              v-model="descriptionString"
              @keydown.meta.enter="save"
              counter="200"
          />
        </div>
        <v-list nav class="pt-0 pb-6 px-6">
          <v-list-item @click="myHasAlert = !myHasAlert">
            <template #prepend>
              <v-switch readonly color="primary" v-model="myHasAlert" class="mr-2 mt-2"/>
            </template>
            
            <v-list-item-title class="text-subtitle-1 mb-1">
              Receive alerts
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2" style="white-space: normal;">
              Get an email when new results appear in this search
            </v-list-item-subtitle>

            
          </v-list-item>

        </v-list>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="myIsOpen = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    <v-card v-else flat rounded>
      <v-card-title>Login required</v-card-title>
      <v-card-text>
        To {{ myHasAlert ? "set alerts" : "save searches" }}, you must be signed up and logged in.
      </v-card-text>
      <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "SavedSearchSaveDialog",
  components: {},
  props: {
    isOpen: Boolean,
    hasAlert: Boolean,
  },
  data() {
    return {
      nameString: "",
      descriptionString: "",
      isLoading: false,
      myHasAlert: false,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    currentUrl(){
      return "https://openalex.org" + this.$route.fullPath
    },
    myIsOpen: {
      get(){return this.isOpen},
      set(){
        this.$emit("close");
      }
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
        "setIsLoginDialogOpen",
        "setIsSignupDialogOpen",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
        "updateSearchDescription",
    ]),
    async save(){
      console.log("save search", this.nameString, this.myHasAlert)
      this.isLoading = true
      await this.$store.dispatch("user/createSearch", {
        search_url: this.currentUrl,
        name: this.nameString,
        description: this.descriptionString,
        has_alert: this.myHasAlert
      })
      this.myIsOpen = false
      this.isLoading = false
      this.snackbar("Search saved.")
    },
    clickSignup(){
      this.myIsOpen = false
      this.setIsSignupDialogOpen(true)
    },
    clickLogin(){
      this.myIsOpen = false
      this.setIsLoginDialogOpen(true)
    },
  },
  watch: {
    "$route"() {
    },
    isOpen() {
      this.nameString = ""
      this.descriptionString = ""
      this.myHasAlert = this.hasAlert
    }
  }
}
</script>


<style scoped lang="scss">

</style>