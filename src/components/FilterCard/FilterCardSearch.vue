<template>
  <v-card rounded>
    <div class="pa-2">
      <v-text-field
          style="width: 100%;"
          rounded
          outlined
          full-width
          v-model="searchString"
          hide-details
          @keydown.enter="submit"
          autofocus
      >
      </v-text-field>
<!--      <try-chips-->
<!--          :ideas="['2023', '2020-', '2020-2024', '-2020']"-->
<!--          @select="idea => searchString = idea"-->
<!--      />-->

    </div>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text rounded @click="isActive = false">Cancel</v-btn>
      <v-btn color="primary" rounded @click="submit">Apply</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import TryChips from "@/components/TryChips.vue";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";


export default {
  name: "FilterCardSearch",
  components: {TryChips},
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    value: {
      get() {
        return url.readFilterValue(this.$route, this.$store.state.entityType, this.index)
      },
      set(to) {
        console.log("FilterRange value set()", to)
        this.value ?
            url.updateOrDeleteFilter(this.entityType, this.index, to) :
            url.createFilter(this.entityType, this.filterKey, to)
      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    submit() {
      this.$emit("close")
      this.value = this.searchString
    },


  },
  created() {
  },
  mounted() {
    this.searchString = this.value
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>