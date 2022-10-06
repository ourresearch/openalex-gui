<template>
  <div
      class="py-1 pl-4 pr-6 my-0 d-flex filter-row"
  >
    <div>
      <v-checkbox
          dense
          hide-details
          color="primary"
          class="pa-0 ma-0 mr-2"
          v-model="isChecked"/>
    </div>
    <div
        class="body-1  text-capitalize"
        style="line-height: 1.5; "
    >
      <router-link
          v-if="filter.isEntity"
          :to="filter.value | entityZoomLink"
          color="white"
          class="hover-underline"
          style="color: #fff;"
      >
        {{ prettyDisplayName }}
      </router-link>
      <span
          v-else
          :class="{textCapitalize: filter.key === 'host_venue.publisher'}"
      >
        {{ prettyDisplayName }}
      </span>
    </div>
    <v-spacer></v-spacer>
    <div class="body-2 grey--text" style="margin: 1px 5px 0 20px;">
      {{ filter.count.toLocaleString() }}
    </div>
    <div v-if="!hideBar" class="facet-option-bar-container">
      <div
          class="facet-option-bar-bar"
          :class="{selected: isChecked}"
          :style="{width: (filter.countNormalized * 100) + '%'}"
      >

      </div>

    </div>
  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'

export default {
  name: "FacetValueListItem",
  components: {},
  props: {
    filter: Object,
    showChecked: Boolean,
    indent: Boolean,
    hideBar: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
    ]),
    prettyDisplayName() {
      let ret = this.filter.displayValue
          .replace("ieee", "IEEE")
          .replace("United States of America", "USA")
          .replace("United Kingdom of Great Britain and Northern Ireland", "UK")

      if (this.filter.key === "type") {
        ret = ret.replace("-", " ")
      }
      if (this.filter.key === 'oa_status') {
        // ret = ret.replace("hybrid", "hybrid OA")
        //     .replace("gold", "gold OA")
        //     .replace("green", "gold OA")
        //     .replace("bronze", "gold OA")
        //     .replace("closed", "paywalled")
      }


      return ret
    },
    entityType() {
      return this.$route.params.entityType
    },
    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
      "addInputFilters",
      "removeInputFilters",
    ]),
    toggleIsChecked() {
      this.isChecked = !this.isChecked
    }
  },

  created() {
  },
  async mounted() {
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {
    isChecked: {
      immediate: false,
      handler(isCheckedNow) {
        console.log("FacetOptions isChecked watcher", isCheckedNow)
        if (isCheckedNow) this.addInputFilters([this.filter])
        else this.removeInputFilters([this.filter])
      },
    },
  }
}
</script>

<style scoped lang="scss">

a.hover-underline {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.facet-option-bar-container {
  width: 20px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  flex: none;
  margin-top: 6px;
  margin-left: 5px;
}

.facet-option-bar-bar {
  background-color: rgba(255, 255, 255, .75);
  height: 100%;

  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}

.filter-row {
  //cursor: pointer;
  //
  //&:hover {
  //  background: #eee;
  //}
}

</style>