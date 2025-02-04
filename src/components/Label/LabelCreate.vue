<template>
  <v-card rounded :loading="isLoading">
    <v-card-title>Create {{ idsArray.length ? "and apply" : "" }} Label</v-card-title>
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
          <template v-if="full">
            <v-select
              v-model="entity_type"
              :items="entity_types"
              label="Type"
              item-text="text"
              item-value="value"
              filled
              rounded
              class="mt-4"
              required
              hide-details
            ></v-select>
            <v-textarea
              v-model="description"
              label="Description (optional)"
              filled
              rounded
              class="mt-4"
              hide-details
              rows="3"
            ></v-textarea>
          </template>
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
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "LabelCreate",
  components: {},
  props: {
    full: {
      type: Boolean,
      default: false,
    },
    ids: {
      type: Array,
      required: false,
    },
    entity_type: {
      type: String,
      required: false,
      default: "authors"
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
    entity_types() {
      return Object.keys(getConfigs()).map(entity_type => ({
        text: entity_type.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: entity_type
      }));
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "createCollection"
    ]),
    async create(){
      if (!this.name) return;

      this.isLoading = true;
      const payload = {
        ids: this.idsArray,
        name: this.name,
        entity_type: this.entity_type,
      };
      
      if (this.full) {
        if (this.description) {
          payload.description = this.description;
        }
      }

      console.log("Create payload")
      console.log(payload)
      
      await this.createCollection(payload);
      this.isLoading = false;
      this.snackbar({msg: "Label created" + (this.idsArray.length ? " and applied" : "")});
      this.close();
    },
    close(){
      this.name = "";
      this.description = "";
      this.idsArray = [];
      this.$emit('close');
    }
  },
  created() {
  },
  mounted() {
    console.log("LabelCreate with", this.ids)
  },
  watch: {}
}
</script>


<style scoped lang="scss">

</style>