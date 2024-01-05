<template>

    <v-card
        rounded
        flat
        class="filter d-flex align-center py-2 mr-2 mb-2"
    >
        <div class="px-4">
          <v-icon class="">{{ config.icon }}</v-icon>
        </div>
        <v-chip
            class="mr-2"
            @click="myValue = !myValue"
            outlined
            label
        >
          {{ myValue ? "is" : "is NOT" }}
        </v-chip>
        <div class="font-weight-bold">{{ config.displayName }}</div>
        <v-spacer/>
        <div class="px-4">
          <v-btn icon @click="$emit('delete')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>


    </v-card>




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
      get() {
        return url.readFilterValue(this.entityType, this.filterKey)
      },
      set(to) {
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
    toggleValue() {

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