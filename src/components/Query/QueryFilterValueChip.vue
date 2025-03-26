<template>
  <v-chip
    label
    class="menu-chip"
    :style="{'font-size': '30px', 'border-bottom-color': buttonColorHex}"
  >
    <template v-if="columnConfig.objectEntity">
      <template v-if="entityData">
        <b>{{ entityData.display_name | truncate(50) }}</b>
        <v-icon v-if="isEditable && !isSentence" x-small>mdi-pencil-outline</v-icon>
      </template>
      <template v-else>
        Loading...
      </template>
    </template>
    <template v-else-if="columnConfig.type === 'boolean'">
      <b>{{ value ? 'true' : 'false' }}</b>
    </template>
    <template v-else-if="columnConfig.id === 'related_to_text'">
      {{ value }}
    </template> 
    <template v-else>
      <b>{{columnConfig.isCurrency ? '$' : ''}}{{ value | truncate(50) }}</b>
    </template>
  </v-chip>
</template>


<script>

import {api} from "@/api";
import {mapGetters} from "vuex";

export default {
  name: "QueryFilterValueChip",
  components: {
  },
  props: {
    columnConfig: Object,
    value: [String, Number,Boolean],
    isLabelFilter: Boolean,
    isEditable: Boolean,
    subjectEntity: String,
    isSentence: Boolean,
  },
  data() {
    return {
      entityData: null,
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters(['uiVariant']),
    buttonColorHex() {
      return "#999";
      const colorName = ['works', 'summary'].includes(this.subjectEntity) ? 'catWorksDarker' : 'catEntityDarker';
      return this.$vuetify.theme.themes.light[colorName];
    },
    isBoxed() {
      return this.columnConfig.id === 'related_to_text';
    }
  },
  methods: {
    async getEntity() {
      if (!this.columnConfig.objectEntity) { 
        return;
      } else if (this.isLabelFilter) {
        const collection = this.$store.getters['user/getCollection'](this.value)
        this.entityData = {
          display_name: collection.name,
        }
      } else {
        this.isLoading = true;
        const response = await api.getEntity(this.value);
        this.entityData = response;
        this.isLoading = false;   
      }
    },
  },
  created() {
    if (!this.value) { 
      throw new Error(
        "QueryFilterValueChip only works if there's a value for the filter"
      )
    };
  },
  watch: {
    value: {
      handler: function (newValue, oldValue) {
        if (newValue) {
          this.getEntity();
        }
      },
      immediate: true,
    }
  }
}
</script>


<style scoped lang="scss">
.v-icon {
  margin-left: 4px;
}
</style>