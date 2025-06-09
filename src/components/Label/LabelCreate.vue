<template>
  <v-card rounded :loading="isLoading">
    <v-card-title>{{ editId ? 'Edit Label' : `Create${idsArray.length ? ' and apply' : ''} Label` }}</v-card-title>
    <v-card-text>
      <form>
          <v-text-field
              variant="solo-filled"
              flat
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
            <div style="position: relative;"> <!-- for catching events on a disabled select -->
              <v-select
                v-model="entity_type"
                :items="entity_types"
                label="Type"
                item-title="text"
                item-value="value"
                variant="solo-filled"
                flat
                rounded
                class="mt-4"
                required
                hide-details
                :disabled="isChangeTypeDisabled"
              ></v-select>
              <div
                v-if="isChangeTypeDisabled"
                @click.prevent="handleDisabledSelectClick"
                style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"
              ></div>
            </div>
            <v-textarea
              v-model="description"
              label="Description (optional)"
              variant="solo-filled"
              flat
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
      <v-btn :disabled="isLoading" rounded variant="text" @click="$emit('close')">Cancel</v-btn>
      <v-btn
          color="primary"
          variant="flat"
          rounded
          :disabled="!name || isLoading"
          @click="create">
        {{ editId ? "Save" : "Create" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapMutations} from "vuex";
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
    entityType: {
      type: String,
      required: false,
      default: "authors"
    },
    editId: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      isLoading: false,
      name: "",
      description: "",
      entity_type: this.entityType,
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
    isChangeTypeDisabled() {
      const label = this.$store.getters['user/getCollection'](this.editId);
      const val = this.editId && label.ids.length > 0;
      return val;
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions("user", [
      "createCollection",
      "updateCollection"
    ]),
    handleDisabledSelectClick() {
      this.snackbar({
        msg: "To change label type, please delete existing items first.",
      });
    },
    async create(){
      if (!this.name) { return; }

      this.isLoading = true;
      const payload = {
        ids: this.idsArray,
        name: this.name,
        entity_type: this.entity_type,
      };
      
      if (this.description) {
        payload.description = this.description;
      }

      if (this.editId) {
        await this.updateCollection({
          id: this.editId,
          name: this.name,
          description: this.description,
          entity_type: this.entity_type,
        });
        this.snackbar({msg: "Label updated"});
      } else {
        await this.createCollection(payload);
        this.snackbar({msg: "Label created" + (this.idsArray.length ? " and applied" : "")});
      }
      
      this.isLoading = false;
      this.close();
    },
    close(){
      this.name = "";
      this.description = "";
      this.idsArray = [];
      this.$emit('close');
    }
  },
  async created() {
    if (this.editId) {
      const collection = this.$store.getters['user/getCollection'](this.editId);
      if (collection) {
        this.name = collection.name;
        this.description = collection.description || "";
        this.entity_type = collection.entity_type;
      }
    }
  },
}
</script>


<style scoped lang="scss">

</style>