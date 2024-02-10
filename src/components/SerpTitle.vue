<template>
  <v-card rounded class="d-flex" flat>
    <!--    <v-btn  icon class="mr-2">-->
    <!--      <v-icon >mdi-folder-outline</v-icon>-->
    <!--    </v-btn>-->

    <div class="">
      <v-btn rounded text class="text-h6 mr-2" @click="clickTitle">
        {{ activeSearchName || "Unsaved search" }}
      </v-btn>
      <!--      <div v-if="activeSearchDescription" class="body-2 grey&#45;&#45;text mb-2">-->
      <!--        {{ activeSearchDescription }}-->
      <!--      </div>-->

    </div>
    <!--      <v-divider></v-divider>-->

    <!--    <v-btn icon to="/me/searches" v-if="userId" class="ml-3">-->
    <!--      <v-icon>mdi-folder-outline</v-icon>-->
    <!--    </v-btn>-->
    <!--    <v-menu offset-y>-->
    <!--      <template v-slot:activator="{on}">-->
    <!--        <v-btn-->
    <!--            v-on="on"-->
    <!--            text-->
    <!--            rounded-->
    <!--            class="text-h6 "-->
    <!--        >-->
    <!--          {{ activeSearchDescription || "Unsaved search" }}-->
    <!--          <v-icon class="ml-1">mdi-menu-down</v-icon>-->
    <!--        </v-btn>-->
    <!--      </template>-->
    <!--      <saved-search-menu-->
    <!--          :id="$route.query.id"-->
    <!--          @save="clickSaveButton"-->
    <!--      />-->
    <!--    </v-menu>-->

    <v-dialog v-model="isLoginRequiredDialogOpen" max-width="500">
      <v-card rounded>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          To rename searches, you must be signed up and logged in.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

    <saved-search-save-dialog
        :is-open="isDialogOpen.saveSearch"
        @close="isDialogOpen.saveSearch = false"
    />


  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";
import SavedSearchSaveDialog from "@/components/SavedSearchSaveDialog.vue";

export default {
  name: "Template",
  components: {
    SavedSearchSaveDialog,
    SavedSearchMenu,
  },
  props: {},
  data() {
    return {
      foo: 42,
      isLoginRequiredDialogOpen: false,
      isDialogOpen: {
        saveSearch: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "activeSearchDescription",
      "activeSearchName",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setIsSignupDialogOpen",
      "setIsLoginDialogOpen",
      "setRenameId",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    clickLogin() {
      this.isLoginRequiredDialogOpen = false
      this.setIsLoginDialogOpen(true)
    },
    clickSignup() {
      this.isLoginRequiredDialogOpen = false
      this.setIsSignupDialogOpen(true)
    },
    clickTitle() {
      if (this.userId) {
        if (this.$route.query.id) {
          this.setRenameId(this.$route.query.id)
        }
        else {
          this.isDialogOpen.saveSearch = true
        }
      } else {
        this.isLoginRequiredDialogOpen = true
      }
    },

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