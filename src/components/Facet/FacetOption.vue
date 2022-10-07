<template>
  <div
      class="pt-0 pb-2 pl-4 pr-6 my-0 d-flex filter-row"
  >
    <div>
      <v-checkbox
          dense
          hide-details
          class="pa-0 ma-0 mr-2"
          color="green lighten-2"
          on-icon="mdi-checkbox-marked-circle"
          off-icon="mdi-checkbox-blank-circle-outline"
          @click="click($event)"
          :input-value="isChecked"
      />
    </div>
    <div
        class="body-1  "
        style="line-height: 1.5; "
        :class="{'font-weight-bold': isChecked}"
    >
      <router-link
          v-if="filter.isEntity"
          :to="filter.value | entityZoomLink"
          class="hover-underline text--lighten-2 white--text"
          :class="{'green--text': isChecked}"
          v-html="prettyDisplayName"
      >
      </router-link>
      <span
          v-else
          class="text--lighten-2"
          :class="{'green--text': isChecked,}"
          v-html="prettyDisplayName"
      >
      </span>
    </div>
    <v-spacer></v-spacer>
    <div class="body-2 grey--text" style="margin: 1px 5px 0 20px;">
      {{ filter.count.toLocaleString() }}
    </div>
    <div v-if="!hideBar" class="facet-option-bar-container">
      <div
          class="facet-option-bar-bar lighten-2"
          :class="{selected: isChecked, 'green': isChecked}"
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
import {prettyTitle} from "../../util";

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
      if (this.filter.isBoolean){
        const valueAsInt = (this.filter.value === "true") ? 1 : 0;
        return this.filter.booleanValues[valueAsInt]
      }


      let ret = this.filter.displayValue
          .replace("ieee", "IEEE")
          .replace("United States of America", "USA")
          .replace("United Kingdom of Great Britain and Northern Ireland", "UK")

      if (this.filter.key === "type") {
        ret = ret.replace("-", " ")
      }
      ret = prettyTitle(ret)

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
    },
    click(e){
      this.isChecked = !this.isChecked
      if (this.isChecked) this.addInputFilters([this.filter])
      else this.removeInputFilters([this.filter])
      this.$emit("click-checkbox", e)
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