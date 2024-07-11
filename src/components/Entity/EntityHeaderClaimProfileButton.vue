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
    clickClaim(){
      if (!this.userId) {
        this.isDialogOpen = true;
      } else {
        this.setAuthorId(this.authorId);
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