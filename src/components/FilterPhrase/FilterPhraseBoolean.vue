<template>
  <div class="phrase phrase-boolean" @click="isDialogOpen = true">
    <span>the work {{ myValue ? "is" : "is not" }}</span>
    <span>
      {{ myFilterConfig.displayName }}
    </span>
    <edit-phrase-boolean
      v-model="isDialogOpen"
      :filter-key="filterKey"
    />
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
    myFilterConfig() {
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