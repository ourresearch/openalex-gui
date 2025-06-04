<template>
  <v-card rounded>
    <div class="pa-2">
      <v-text-field
          style="width: 100%;"
          rounded
          variant="outlined"
          v-model="searchString"
          hide-details
          @keydown.enter="submit"
          autofocus
      >
      </v-text-field>
    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn variant="text" rounded @click="isActive = false">Cancel</v-btn>
      <v-btn color="primary" rounded @click="submit">Apply</v-btn>
    </v-card-actions>
  </v-card>
</template>


<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "FilterCardSearch",
  components: {},
  props: {
    filterKey: String,
  },
  data() {
    return {
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey);
    },
    value: {
      get() {
        return url.readFilterValue(this.$route, this.entityType, this.index);
      },
      set(to) {
        console.log("FilterRange value set()", to);
        this.value ?
            url.updateOrDeleteFilter(this.entityType, this.index, to) :
            url.createFilter(this.entityType, this.filterKey, to);
      }
    },
  },
  methods: {
    submit() {
      this.$emit("close")
      this.value = this.searchString
    },
  },
  mounted() {
    this.searchString = this.value;
  },
}
</script>


<style scoped lang="scss">

</style>