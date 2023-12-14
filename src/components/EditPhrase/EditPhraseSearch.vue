<template>
  <span>
    <v-dialog
         v-model="isOpen"
         max-width="800"
     >
      <v-card rounded>

        <v-text-field
            class="text-h5 pb-2"
            v-model="searchString"
            autofocus
            rounded
            clearable
            hide-details
            @keydown.enter="submit"
        >
          <template v-slot:prepend-inner>
            <span style="padding-top: 0px;" class="grey--text">
            {{ myFilterConfig.displayName }}:
            </span>
          </template>
        </v-text-field>
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
    submit(){
      if (!this.searchString) {
        url.deleteFilter(this.entityType, this.filterKey)
      }
      else {
        url.upsertFilter(
            this.entityType,
            this.filterKey,
            this.searchString
        )
      }
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