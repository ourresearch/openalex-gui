<template>

  <v-col cols="12" lg="4" xl="3">
    <v-card rounded flat class="filter filter-boolean d-flex align-center pa-2">
      <div>
        <v-icon left>{{ config.icon }}</v-icon>
      </div>
        <div class="font-weight-bold mr-1" v-if="!myValue">NOT </div>
        <div class="">{{ config.displayName }}</div>
        <v-spacer/>
        <v-chip
            small
            @click="myValue = !myValue"
            class="pa-0"
        >
          <v-chip
              small
              :dark="!myValue"
          >
            ≠
          </v-chip>
          <v-chip
              small
              :dark="!!myValue">
            =
          </v-chip>
        </v-chip>
      <div>
        <v-btn small icon @click="$emit('delete')">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </div>


    </v-card>


  </v-col>


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