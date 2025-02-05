<template>
  <div class="py-6 ma-0">
    <div class="label-details-header px-5 pb-5">
      <div class="d-flex align-center w-100">
        <div class="header-right">
          <div>
            <span class="text-h5">
              <v-icon>mdi-tag-outline</v-icon>
              {{ labelData.name }}
            </span>

            <span class="subtitle">
              {{ labelData.ids.length}} {{ labelData.entity_type }}
            </span>
          </div>
          <router-link class="all-labels-link" to="/me/labels">« All Labels</router-link>    
        </div>
      </div>

      <v-spacer />
      <div class="header-left">
        <div class="header-left-buttons">
          <v-btn
            small
            class="mr-2"
            @click="showEditDialog = true"
          >
            <v-icon left>mdi-pencil</v-icon>
            Edit
          </v-btn>
          <v-btn
            small
            class="mr-2"
            @click="deleteLabel"
          >
            <v-icon left>mdi-delete-outline</v-icon>
            Delete
          </v-btn>
        </div>
      </div>
    </div>
    
    <v-card-text v-if="!this.displayNamesLoaded" >
      Loading...
    </v-card-text>

    <v-list v-else-if="labelData.ids.length" class="label-items py-3 px-0">
      <v-list-item
          v-for="(id, index) in labelData.ids"
          :key="id"
          class="px-8 ma-0"
          @click="clickRow(id)"
      >
        <v-list-item-content>
          <v-list-item-title>
            <span class="mr-1" style="display: inline-block; min-width: 16px;">{{ index + 1 }}.</span>
            {{ entityDisplayName(id) }}
        </v-list-item-title>
        </v-list-item-content>
        <v-list-item-action class="my-0">
          <v-btn icon @click.stop="removeId(id)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <div class="label-details-add-section px-6">
      <div class="label">Add to Label:</div>
      <entity-autocomplete
        :entityType="labelData.entity_type"
        @entity-selected="addId($event.id)"
      />
    </div>

    <v-dialog
      v-model="showEditDialog"
      max-width="600px"
    >
      <label-create
        v-if="showEditDialog"
        :edit-id="labelId"
        :full="true"
        @close="showEditDialog = false"
      />
    </v-dialog>
  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex"
import {api} from "@/api"
import EntityAutocomplete from "@/components/EntityAutocomplete.vue"
import LabelCreate from "@/components/Label/LabelCreate.vue"


export default {
  name: "LabelDetails",
  components: {
    EntityAutocomplete,
    LabelCreate,
  },
  props: {},
  data() {
    return {
      displayNamesLoaded: false,
      showEditDialog: false,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userCollections",
    ]),
    labelId() {
      return this.$route.params.labelId || null;
    },
    labelData() {
      return this.userCollections.find(coll => coll.id === this.labelId);
    },
  },
  methods: {
    ...mapActions("user", [
      "updateCollectionIds",
      "deleteCollection",
    ]),
    async loadAllDisplayNames() {
      const calls = this.labelData.ids.map(id => api.getEntity(id));
      await Promise.all(calls);
      //console.log("loadedAllDisplayNames")
      this.displayNamesLoaded = true;
    },
    entityDisplayName(id) {
      return api.getEntityFromCache(id).display_name;
    },
    async addId(id) {
      const newIds = [...new Set([...this.labelData.ids, id])];
      await api.getEntity(id); // To preload entity display name
      await this.updateCollectionIds({collectionId: this.labelId, ids: newIds});
    },
    async removeId(id) {
      const newIds = this.labelData.ids.filter(existingId => existingId != id);
      await this.updateCollectionIds({collectionId: this.labelId, ids: newIds});
    },
    clickRow(rowId) {
      this.$store.state.zoomId = rowId;
    },
    async deleteLabel() {
      const resp = await this.deleteCollection(this.labelId);
      if (resp) {
        this.$router.push("/me/labels");
      }
    }
  },
  created() {
    this.loadAllDisplayNames();
  },
}
</script>


<style scoped lang="scss">
.label-details-header {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: flex-start;
  padding-bottom: 10px !important;
  border-bottom: 1px solid #ddd;
}
.label-details-header .header-right {
  flex: 1;
}
.label-details-header .subtitle {
  font-size: 14px;
  color: #777;
  margin-left: 10px;
}
.all-labels-link {
  display: inline-block;
  text-decoration: none;
  color: #555;
  margin-left: 4px;
  font-size: 12px;
}
.label-items {
  border-bottom: 1px solid #ddd;
}
.label-details-add-section{
  padding-top: 20px;
}
.label-details-add-section .label {
  margin-bottom: 10px;
}
</style>