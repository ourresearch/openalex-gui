<template>
  <v-card rounded :loading="isLoading">
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
              @keydown.enter.prevent="create"
          >
          </v-text-field>
      </form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn :disabled="isLoading" rounded text @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          rounded
          :disabled="!name || isLoading"
          @click="create">
        Create
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "LabelCreate",
  components: {},
  props: {
    ids: {
      type: Array,
      required: false,
    }
  },
  data() {
    return {
      isLoading: false,
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
    async create(){
      if (!this.name) return

      this.isLoading = true
      await this.createCollection({ids: this.idsArray, name: this.name})
      this.isLoading = false
      this.snackbar({msg: "Label created" + (this.idsArray.length ? " and applied" : "")})
      this.close()
    },
    close(){
      this.name = ""
      this.description = ""
      this.idsArray = []
      this.$emit('close')
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