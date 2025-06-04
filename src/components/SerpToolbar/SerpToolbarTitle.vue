<template>
  <div>

    <!--    <v-btn icon class="mr-2">-->
    <!--      <v-icon>mdi-folder-outline</v-icon>-->
    <!--    </v-btn>-->

    <!--    <v-btn icon to="/me/searches" v-if="userId" class="ml-3">-->
    <!--      <v-icon>mdi-folder-outline</v-icon>-->
    <!--    </v-btn>-->

    <!-- you can only save works searches for now -->
    <div v-if="entityType === 'works'">
      <v-btn v-if="!userId" rounded variant="text" class="font-weight-regular" @click="clickTitle">
         Unsaved search
        <v-icon class="ml-1">mdi-menu-down</v-icon>
      </v-btn>
      <v-menu v-else location="bottom">
        <template v-slot:activator="{props}">
          <v-btn
              v-bind="props"
              variant="text"
              rounded
              class="font-weight-regular"
          >
            <!--                        <v-icon left>mdi-content-save-outline</v-icon>-->
            {{ activeSearchName || "Unsaved search" }}
            <v-icon class="ml-1">mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <saved-search-menu
            :id="$route.query.id"
            @save="$emit('save')"
            @toggle-alert="$emit('toggle-alert')"
        />
      </v-menu>

    </div>

    <v-dialog v-model="isLoginRequiredDialogOpen" max-width="500">
      <v-card rounded>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          To save searches, please log in or sign up.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn variant="text" rounded @click="clickLogin">Log in</v-btn>
          <v-btn rounded color="primary" @click="clickSignup">Sign up</v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

    <saved-search-save-dialog
        :is-open="isDialogOpen.saveSearch"
        @close="isDialogOpen.saveSearch = false"
    />


  </div>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";
import SavedSearchSaveDialog from "@/components/SavedSearchSaveDialog.vue";

export default {
  name: "SerpToolbarTitle",
  components: {
    SavedSearchSaveDialog,
    SavedSearchMenu,
  },
  props: {},
  data() {
    return {
      isLoginRequiredDialogOpen: false,
      isDialogOpen: {
        saveSearch: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "activeSearchDescription",
      "activeSearchName",
    ]),
  },
  methods: {
    ...mapMutations("user", [
      "setIsSignupDialogOpen",
      "setIsLoginDialogOpen",
      "setRenameId",
    ]),
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
        } else {
          this.isDialogOpen.saveSearch = true
        }
      } else {
        this.isLoginRequiredDialogOpen = true
      }
    },
  },
}
</script>


<style scoped lang="scss">

</style>