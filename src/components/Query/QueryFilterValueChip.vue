<template>
  <v-chip
    label
    class="menu-chip"
    :style="{'border-bottom-color': buttonColorHex}"
    @click="$emit('click', $event)"
  >
    <template v-if="columnConfig.objectEntity">
      <template v-if="entityData">
        <b>{{ filters.truncate(entityData.display_name || '', 50) }}</b>
        <v-icon v-if="isEditable && !isSentence" size="x-small">mdi-pencil-outline</v-icon>
      </template>
      <template v-else>
        Loading...
      </template>
    </template>
    <template v-else-if="columnConfig.type === 'boolean'">
      <b>{{ value ? 'true' : 'false' }}</b>
    </template>
    <template v-else-if="columnConfig.id === 'related_to_text'">
      {{ filters.truncate(value || '', 50) }}
    </template> 
    <template v-else>
      <b>{{columnConfig.isCurrency ? '$' : ''}}{{ filters.truncate(value || '', 50) }}</b>
    </template>
  </v-chip>
</template>


<script>

import {mapGetters} from "vuex";
import {api} from "@/api";
import filters from "@/filters";

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
      filters,
    }
  },
  computed: {
    ...mapGetters(['uiVariant']),
    buttonColorHex() {
      return "#AAA";
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
      console.log("QueryFilterValueChip: no value");
      /*
      throw new Error(
        "QueryFilterValueChip only works if there's a value for the filter"
      )
      */
    }
  },
  watch: {
    value: {
      handler: function (newValue) {
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