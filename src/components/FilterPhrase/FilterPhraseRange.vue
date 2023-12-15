<template>
  <div class="phrase phrase-range" @click="isDialogOpen = true">
    <span>
      the {{ myFilterConfig.displayName }} is
    </span>
    <span>
      {{ text }}
    </span>

    <edit-phrase-range
      v-model="isDialogOpen"
      :filter-key="filterKey"

    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import EditPhraseRange from "@/components/EditPhrase/EditPhraseRange.vue";

export default {
  name: "FilterValueSearch",
  components: {
    EditPhraseRange,
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
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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