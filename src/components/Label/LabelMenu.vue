<template>
  <div style="display: inline-block;">
    <v-menu content-class="label-menu"max-width="400px">
      <template v-slot:activator="{ on }">
        <v-btn small :icon="icon" v-on="on" :disabled="!selectedIds.length">
          <v-icon small >mdi-tag-outline</v-icon>
          <span v-if="!icon">Labels</span>
        </v-btn>
      </template>
      <v-list>
        <v-subheader>Apply Label:</v-subheader>
        <v-list-item
            v-for="label in availableLabels"
            :key="label.id"
            @click="toggle(label.id)"
        >
          <v-list-item-icon @click="toggle(label.id)">
            <v-icon v-if="showCheck(label.id)">mdi-checkbox-outline</v-icon>
            <v-icon v-else-if="showHalfCheck(label.id)">mdi-minus-box-outline</v-icon>
            <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ label.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider/>
        <v-list-item
            key="create-label"
            @click="isCreateLabelDialogOpen = true"
        >
          <v-list-item-icon>
            <v-icon>mdi-tag-plus-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>New Label</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
            key="manage-labels"
            to="/me/labels"
        >
          <v-list-item-icon>
            <v-icon>mdi-tag-edit-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Manage Labels</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog v-model="isCreateLabelDialogOpen" width="500">
      <label-create :ids="selectedIds" :entityType="querySubjectEntity" @close="isCreateLabelDialogOpen = false"/>
    </v-dialog>
  </div>
</template>


<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import LabelCreate from "@/components/Label/LabelCreate.vue";

export default {
  name: "LabelMenu",
  components: {
    LabelCreate,
  },
  props: {
    selectedIds: Array,
    icon: {
      type: Boolean,
      default: true
    },
  },
  data() {
    return {
      isCreateLabelDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters("search", [
      "querySubjectEntity",
    ]),
    ...mapGetters("user", [
      "userCollections",
    ]),
    availableLabels() {
      const labels = this.$store.getters['user/getCollectionsByType'](this.querySubjectEntity);
      return labels;
    }
  },
  methods: {
    ...mapActions("user", [
      "updateCollectionIds",
    ]),
    collectionById(id) {
      return this.userCollections.find(coll => coll.id === id);
    },
    showCheck(collectionId) {
      // Show a check mark only if every selected ID has the label
      const collection = this.collectionById(collectionId);
      return this.selectedIds.every(selectedId => collection.ids.includes(selectedId));
    },
    showHalfCheck(collectionId) {
      const collection = this.collectionById(collectionId);
      return this.selectedIds.some(selectedId => collection.ids.includes(selectedId));
    },
    addIds(collectionId) {
      const collection = this.collectionById(collectionId);
      const newIds = [...new Set([...collection.ids, ...this.selectedIds])];
      this.updateCollectionIds({collectionId, ids: newIds});
    },
    removeIds(collectionId) {
      const collection = this.collectionById(collectionId);
      const newIds = collection.ids.filter(id => !this.selectedIds.includes(id));
      this.updateCollectionIds({collectionId, ids: newIds});
    },
    toggle(collectionId) {
      this.showCheck(collectionId) ? this.removeIds(collectionId) : this.addIds(collectionId);
    }
  }
}

</script>

<style>
.label-menu .v-subheader {
  height: 25px;
}
</style>