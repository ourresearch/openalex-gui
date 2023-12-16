<template>
  <div class="filter filter-boolean d-flex align-center">
    <v-icon  left>{{ config.icon }}</v-icon>
    <div>
      <span>
        the work
        <v-chip outlined style="font-size: 20px;" @click="myValue = !myValue">
<!--          <v-icon>mdi-toggle-switch-off-outline</v-icon>-->
          {{ myValue ? "is" : "is not" }}
        </v-chip>

      </span>
      <span>
        {{ config.displayName }}
      </span>
    </div>
    <v-spacer />
    <v-btn icon @click="$emit('delete')">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import EditPhraseBoolean from "@/components/EditPhrase/EditPhraseBoolean.vue";
import {url} from "@/url";

export default {
  name: "FilterValueSearch",
  components: {
    EditPhraseBoolean,
  },
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,

      isDialogOpen: false,
      text: url.readFilterValue(this.$store.state.entityType, this.filterKey),
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    myValue: {
      get(){
        return url.readFilterValue(this.entityType, this.filterKey)
      },
      set(to){
        url.upsertFilter(
            this.entityType,
            this.filterKey,
            !!to
        )
      }

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },
    toggleValue(){

    },

  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>