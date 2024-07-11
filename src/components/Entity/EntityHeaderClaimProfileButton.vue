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
    <v-btn
        v-if="userAuthorId && userAuthorId === authorId"
        color="primary"
        rounded
        class="ml-3"
        @click="deleteAuthorId"
    >
        Profile claimed
    </v-btn>

    <v-dialog rounded max-width="300" v-model="isDialogOpen">
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
              @click="isDialogOpen = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog rounded max-width="300" v-model="isSuccessDialogOpen">
      <v-card rounded>
        <v-card-title>
          Profile claimed
        </v-card-title>
        <div class="pa-4">
          <p>
            Congratulations, you've claimed your author profile! We've submitted your claim for moderation;
            once that's done (it may take a week or so), you'll be able to edit your profile.
          </p>
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
              color="primary"
              rounded
              text
              @click="isSuccessDialogOpen = false"
          >
            Close
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
      isDialogOpen: false,
      isSuccessDialogOpen: false,
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
    async clickClaim(){
      if (!this.userId) {
        this.isDialogOpen = true;
      } else {
        await this.setAuthorId(this.authorId);
        this.isSuccessDialogOpen = true
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