<template>
  <div>
    <v-chip
        outlined
        label
        class="mr-1"
    >
      <template v-if="entityData">
        {{ entityData.display_name | truncate(50) }}
        <v-icon v-if="isEditable" small right>mdi-pencil-outline</v-icon>
      </template>
      <template v-else>
        Loading...
      </template>
    </v-chip>
  </div>
</template>


<script>

import {api} from "@/api";


export default {
  name: "QueryFilterValueChip",
  components: {
  },
  props: {
    columnConfig: Object,
    value: String,
    operator: String,
    isLabelFilter: Boolean,
    isEditable: Boolean,
  },
  data() {
    return {
      entityData: null,
      isLoading: false,
    }
  },
  computed: {},
  methods: {
    async getEntity() {
      if (this.isLabelFilter) {
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
    if (!this.columnConfig.objectEntity) { 
      throw new Error(
        "QueryFilterValueChip only works if there's an objectEntity for the filter"
      )
    }
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

</style>