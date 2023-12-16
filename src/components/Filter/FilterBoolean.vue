<template>
  <div class="filter filter-boolean d-flex align-center">
    <v-icon  left>{{ config.icon }}</v-icon>
    <div>
      <span>the work {{ myValue ? "is" : "is not" }}</span>
      <span>
        {{ config.displayName }}
      </span>
    </div>
    <v-spacer />
    <v-btn icon @click="deleteMe">
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
    myValue(){
      return url.readFilterValue(this.entityType, this.filterKey)
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
    submit() {
      url.upsertFilter(
            this.entityType,
            this.filterKey,
            this.text
        )
    }

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