<template>
  <span>

    <v-dialog
        v-model="isOpen"
        max-width="800"
        style="box-shadow: none;"

    >
        <v-card rounded flat class="d-flex align-center px-3">
          <span class="grey--text text-h5">
              {{ myFilterConfig.displayName }} is
              </span>

          <v-text-field
              class="text-h5 pb-4"
              v-model="searchString"
              autofocus
              rounded
              hide-details
              @keydown.enter="submit"
          >
          </v-text-field>
          <v-btn large icon @click="submit">
            <v-icon large>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn large icon class="" @click="deleteMe">
            <v-icon large>mdi-delete-outline</v-icon>
          </v-btn>
        </v-card>

     </v-dialog>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
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
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    isOpen: {
      get(){
        return this.value
      },
      set(to){
        this.$emit("input", to)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit() {
      if (!this.searchString) {
        url.deleteFilter(this.entityType, this.filterKey)
      } else {
        url.upsertFilter(
            this.entityType,
            this.filterKey,
            this.searchString
        )
      }
    },
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen: {
      immediate: true,
      handler(to, from) {
        this.searchString = url.readFilterValue(this.$store.state.entityType, this.filterKey)
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>