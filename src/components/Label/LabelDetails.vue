<template>
  <div class="pa-3">
    <div class="text-h5">
      <v-icon>mdi-tag-outline</v-icon>
      {{ labelData.name }}
    </div>

    <v-card-text v-if="!labelData.ids.length">
      You haven't added anything to this label yet.
    </v-card-text>
    
    <v-card-text v-else-if="!this.displayNamesLoaded" >
      Loading...
    </v-card-text>

    <v-list v-else color="transparent">
      <v-list-item
          v-for="id in labelData.ids"
          :key="id"
      >
        <v-list-item-content>
          <v-list-item-title>{{ entityDisplayName(id) }}</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon @click="removeId(id)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    Add to Label:
    <entity-autocomplete
      :entityType="labelData.entityType"
      @entity-selected="addId($event.id)"
    />

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
    ...mapGetters([
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userCollections",
    ]),
    labelId() {
      return this.$route.params.labelId || null;
    },
    labelData() {
      return this.userCollections.find(coll => coll.id === this.labelId)
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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
  },
  created() {
    this.loadAllDisplayNames()
  },
  mounted() {
  },
}
</script>


<style scoped lang="scss">

</style>