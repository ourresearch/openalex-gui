<template>
  <div>
    <router-link to="/me/labels" class="all-labels-link d-flex align-center">
      <v-icon size="small" color="primary" class="mr-1">mdi-arrow-left</v-icon>
      All Labels
    </router-link>
    <v-card flat rounded class="pt-6 ma-0">
      <div class="label-details-header px-5 pb-5">
        <div class="d-flex align-center w-100">
          <div class="header-right">
            <div>
              <span v-if="labelData" class="text-h5">
                <v-icon>mdi-tag-outline</v-icon>
                {{ labelData.name }}
              </span>
              <span v-else class="text-h5">
                <v-icon>mdi-tag-outline</v-icon>
                Label not found
              </span>

              <span v-if="labelData" class="subtitle">
                {{ labelData.ids.length}} {{ labelData.entity_type }}
              </span>
            </div>
          </div>
        </div>

        <v-spacer />
        <div class="header-left">
          <div class="header-left-buttons">
            <v-btn
              size="small"
              class="mr-2"
              variant="tonal"
              @click="showEditDialog = true"
            >
              <v-icon start>mdi-pencil</v-icon>
              Edit
            </v-btn>
            <v-btn
              size="small"
              class="mr-2"
              variant="tonal"
              @click="deleteLabel"
            >
              <v-icon start>mdi-delete-outline</v-icon>
              Delete
            </v-btn>
          </div>
        </div>
      </div>
      
      <v-card-text v-if="!this.displayNamesLoaded">
        Loading...
      </v-card-text>
      <v-card-text v-else-if="!labelData">
        Label not found.
      </v-card-text>
      <v-list v-else-if="labelData.ids.length" class="label-items py-3 px-0">
        <v-list-item
          v-for="(id, index) in labelData.ids"
          :key="id"
          class="px-8 ma-0"
          @click="clickRow(id)"
        >
          
          <v-list-item-title>
            <span class="mr-1" style="display: inline-block; min-width: 16px;">{{ index + 1 }}.</span>
            {{ entityDisplayName(id) }}
          </v-list-item-title>
          
          <template #append>
            <v-btn icon variant="plain" @click.stop="removeId(id)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <div class="label-details-action-row d-flex flex-row" style="width: 100%;">
        <div class="label-details-add-section px-6" style="flex: 1.5; display: flex; flex-direction: column; justify-content: center;">
          <div class="label mb-2">Add {{ this.labelData.entity_type }}:</div>
          <entity-autocomplete
            :entityType="labelData.entity_type"
            @entity-selected="addId($event.id)"
          />
        </div>
        <div class="label-details-upload-section px-6 mt-0" style="flex: 1; display: flex; align-items: center; justify-content: center;">
          <v-btn color="primary" rounded @click="showBulkUploadDialog = true">
            <v-icon start>mdi-upload</v-icon>
            Upload {{ filters.capitalize(this.labelData.entity_type) }} List
          </v-btn>
        </div>
      </div>

      <!-- Edit Dialog -->
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

      <!-- Bulk Upload Dialog -->
      <v-dialog
        v-model="showBulkUploadDialog"
        max-width="600px"
        max-height="600px"
      >
        <label-bulk-upload
          v-if="showBulkUploadDialog"
          :label-id="labelId"
          @close="showBulkUploadDialog = false"
        />
      </v-dialog>
    </v-card>
  </div>
</template>


<script>

import {mapActions, mapGetters} from "vuex"
import {api} from "@/api"
import filters from "@/filters"

import EntityAutocomplete from "@/components/EntityAutocomplete.vue"
import LabelCreate from "@/components/Label/LabelCreate.vue"
import LabelBulkUpload from "@/components/Label/LabelBulkUpload.vue"

export default {
  name: "LabelDetails",
  components: {
    EntityAutocomplete,
    LabelCreate,
    LabelBulkUpload,
  },
  props: {},
  data() {
    return {
      displayNamesLoaded: false,
      showEditDialog: false,
      showBulkUploadDialog: false,
      filters,
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
  watch: {
    labelData: {
      handler() {
        this.displayNamesLoaded = false;
        this.loadAllDisplayNames();
      },
      immediate: true,
      deep: false
    }
  },
}
</script>


<style lang="scss">
.label-details-header {
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: flex-start;
  padding-bottom: 10px !important;
  border-bottom: 1px solid #eee;
}
.label-details-header .header-right {
  flex: 1;
}
.label-details-header .header-left-buttons {
  display: flex;
}
.label-details-header .subtitle {
  font-size: 14px;
  color: #777;
  margin-left: 10px;
}
.all-labels-link {
  display: inline-block;
  text-decoration: none;
  margin-left: 4px;
  margin-bottom: 10px;
  font-size: 14px;
}
.label-items {
  border-bottom: 1px solid #eee;
}
.label-details-add-section {
  padding-top: 20px;
}
.label-details-add-section .v-field {
  height: 40px !important;
}
.label-details-add-section .label {
  margin-bottom: 10px;
}
.label-details-upload-section {
  padding: 40px 0;
  border-left: 1px solid #eee;
}
</style>