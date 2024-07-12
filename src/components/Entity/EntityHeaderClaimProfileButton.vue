<template>
  <span>

    <v-btn
        v-if="!userAuthorId"
        text
        rounded
        outlined
        class="ml-3"
        @click="clickClaim"
    >
      Claim profile
    </v-btn>
    <div
        v-if="userAuthorId && userAuthorId === authorId"
        class="ml-3 primary--text font-weight-bold"
        @click.alt="deleteAuthorId"
    >
      <v-icon color="primary">mdi-check-decagram</v-icon>
        claimed
    </div>

    <v-dialog rounded max-width="300" v-model="isLoginRequiredDialogOpen">
      <v-card rounded>
        <div class="pa-4">
          Please log in to claim this profile.
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              color="primary"
              rounded
              text
              @click="isLoginRequiredDialogOpen = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>



    <v-dialog rounded max-width="400" v-model="isConfirmDialogOpen" :persistent="isLoading">
      <v-card rounded :loading="isLoading">
        <v-card-title>
         {{ userAuthorId ? "Profile claimed" : "Claim this profile?" }}
        </v-card-title>
        <div class="pa-4">
          <template v-if="userAuthorId">
            <p>
              Congratulations, you've claimed your author profile!
            </p>
            <p>
              We've submitted your claim for moderation; once that's done (it may take a week or so), you'll be able to edit your profile.
            </p>
          </template>
          <template v-else>
            <p>
              This lets you remove works, or move new ones here from other profiles. You can only claim one profile, so claim the one that matches you best.
            </p>
            <p>
              Do you want to claim this author profile?
            </p>
          </template>
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              rounded
              text
              @click="isConfirmDialogOpen = false"
          >
            {{ userAuthorId ? "Close" : "Cancel" }}
          </v-btn>
          <v-btn
              v-if="!userAuthorId"
              color="primary"
              rounded
              text
              @click="doClaim"
              :disabled="isLoading"
          >
            Yes, claim profile
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    authorId: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      isLoginRequiredDialogOpen: false,
      isConfirmDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userAuthorId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "setAuthorId",
      "deleteAuthorId",

    ]),
    clickClaim() {
      if (!this.userId) {
        this.isLoginRequiredDialogOpen = true;
      } else {
        this.isConfirmDialogOpen = true;
      }
    },
    async doClaim() {
      this.isLoading = true;
      await this.setAuthorId(this.authorId);
      this.isLoading = false;
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