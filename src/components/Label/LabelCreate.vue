<template>
  <v-card rounded>
    <v-card-title>Create {{ idsArray.length ? "and apply" : "" }} label</v-card-title>
    <v-card-text>
      <form>
          <v-text-field
              filled
              rounded
              class="mt-0"

              name="name"
              id="name"
              type="name"

              v-model="name"
              autofocus
              placeholder="Label name"
              hide-details
          >
          </v-text-field>
      </form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn rounded text @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          rounded
          :disabled="!name"
          @click="createCollection({ids: idsArray, name})">
        Create
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    ids: {
      type: Array,
      required: false,
    }
  },
  data() {
    return {
      foo: 42,
      name: "",
      description: "",
      idsArray: this.ids?.length ? this.ids : [],
    }
  },
  computed: {
    ...mapGetters([
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
        "createCollection"
    ]),


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