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
      <v-btn v-if="!userId" rounded text class="font-weight-regular" @click="clickTitle">
         Unsaved search
        <v-icon class="ml-1">mdi-menu-down</v-icon>
      </v-btn>
      <v-menu v-else offset-y>
        <template v-slot:activator="{on}">
          <v-btn
              v-on="on"
              text
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

<!--    <div v-if="activeSearchDescription" class="body-2 ml-5 grey&#45;&#45;text mb-2">-->
<!--      <v-divider></v-divider>-->
<!--      {{ activeSearchDescription }}-->
<!--    </div>-->


    <v-dialog v-model="isLoginRequiredDialogOpen" max-width="500">
      <v-card rounded>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          To save searches, you must be signed up and logged in.
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


  </div>
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
        } else {
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