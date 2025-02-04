<template>
  <div class="py-6 ma-0">
    <div class="label-details-header px-5 pb-5">
      <div class="text-h5">
        <v-icon>mdi-tag-outline</v-icon>
        {{ labelData.name }}
      </div>
      <div class="subtitle">
        {{ labelData.ids.length}} {{ labelData.entity_type }}
      </div>
      <v-spacer />
      <router-link class="all-labels-link" to="/me/labels">« All Labels</router-link>

    </div>
    
    <v-card-text v-if="!this.displayNamesLoaded" >
      Loading...
    </v-card-text>

    <v-list v-else-if="labelData.ids.length" class="label-items py-3 px-0">
      <v-list-item
          v-for="id in labelData.ids"
          :key="id"
          class="px-8 ma-0"
          @click="clickRow(id)"

      >
        <v-list-item-content>
          <v-list-item-title>{{ entityDisplayName(id) }}</v-list-item-title>
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

  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex"
import {api} from "@/api"
import EntityAutocomplete from "@/components/EntityAutocomplete.vue"


export default {
  name: "LabelDetails",
  components: {
    EntityAutocomplete,
  },
  props: {},
  data() {
    return {
      displayNamesLoaded: false,
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
      const calls = this.labelData.ids.map(id => api.getEntity(id))
      await Promise.all(calls)
      //console.log("loadedAllDisplayNames")
      this.displayNamesLoaded = true
    },
    entityDisplayName(id) {
      return api.getEntityFromCache(id).display_name
    },
    async addId(id) {
      const newIds = [...this.labelData.ids, id]
      await api.getEntity(id) // To preload entity display name
      await this.updateCollectionIds({collectionId: this.labelId, ids: newIds})
    },
    async removeId(id) {
      const newIds = this.labelData.ids.filter(existingId => existingId != id)
      await this.updateCollectionIds({collectionId: this.labelId, ids: newIds})
    },
    clickRow(rowId) {
      this.$store.state.zoomId = rowId;
    },
  },
  created() {
    this.loadAllDisplayNames()
  },
  mounted() {
  },
}
</script>


<style scoped lang="scss">
.label-details-header {
  display: flex;
  align-items: flex-end;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
}
.label-details-header .subtitle {
  margin-left: 15px;
  margin-bottom: 2px;
  font-size: 14px;
  color: #777;
}
.all-labels-link {
  text-decoration: none;
  color: #555;
  padding: 0px 5px;
  margin-bottom: 5px
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