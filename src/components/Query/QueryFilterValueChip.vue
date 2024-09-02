<template>
  <div>
    <v-chip
        outlined
        label
        class="mr-1"
    >
      <template v-if="entityData">
        {{ entityData.display_name | truncate(50) }}
      </template>
      <template v-else>
        loading...
      </template>
    </v-chip>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {api} from "@/api";
import axios from "axios";

export default {
  name: "Template",
  components: {
  },
  props: {
    columnConfig: Object,
    value: String,
  },
  data() {
    return {
      foo: 42,
      entityData: null,
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
    ]),
    ...mapActions("search", [
    ]),
    ...mapActions("user", []),
    async getEntity(){
      this.isLoading = true
      const myUrl = "https://api.openalex.org/" + this.value
      const response = await axios.get(myUrl)
      this.entityData = response.data
      this.isLoading = false
    },



  },
  created() {
    if (!this.columnConfig.objectEntity) throw new Error(
        "QueryFilterValueChip only works if there's an objectEntity for the filter"
    )
    if (!this.value) throw new Error(
        "QueryFilterValueChip only works if there's a value for the filter"
    )
  },
  mounted() {
  },
  watch: {
    value: {
      handler: function (newValue, oldValue) {
        if (newValue) {
          this.getEntity()
        }
      },
      immediate: true,
    }
  }
}
</script>

<style scoped lang="scss">

</style>