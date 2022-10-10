<template>
  <div
      class="pb-2 my-0 d-flex filter-row align-start"
  >

<!--      <v-btn-->
<!--          icon-->
<!--          small-->
<!--          class="pa-0 ma-0 mr-3"-->
<!--          :color="(isChecked) ? 'green ' : null"-->
<!--          @click="click($event)"-->
<!--          :loading="isLoading"-->
<!--      >-->
<!--        <v-icon small v-if="isChecked">mdi-checkbox-marked-circle</v-icon>-->
<!--        <v-icon v-else small style="opacity: .5">mdi-plus</v-icon>-->
<!--      </v-btn>-->



      <v-checkbox
          dense
          hide-details
          class="pa-0 ma-0 mr-0"
          :color="(colorful) ? 'green ' : '#999'"
          on-icon="mdi-checkbox-marked-circle"
          off-icon="mdi-checkbox-blank-circle-outline"
          readonly
          @click="click($event)"
          :input-value="isChecked"
          v-if="!isLoading"
          :disabled="disabled"
      />
      <v-progress-circular
          v-if="isLoading"
          size="15"
          width="2"
          indeterminate
          style="margin: 5px 13px 4px 5px;"
          class="ml-1">

      </v-progress-circular>
    <div
        class="body-1 "
        style="line-height: 1.5;"
        :class="{'font-weight-bold': isChecked && colorful, disabled}"
    >
      <router-link
          v-if="filter.isEntity"
          :to="filter.value | entityZoomLink"
          class="hover-underline"
          style="color: #333;"
          :class="{'green--text': isChecked && colorful}"
          v-html="prettyDisplayName"
      >
      </router-link>
      <span
          v-else
          class="text--"
          :class="{'green--text': isChecked && colorful}"
          v-html="prettyDisplayName"
      >
      </span>
    </div>
    <v-spacer></v-spacer>
    <div v-if="!hideNumber"
         class="body-2 grey--text"
         style="margin: 1px 5px 0 20px;"
         :class="{disabled}"
    >
      {{ filter.count.toLocaleString() }}
    </div>
    <div
        v-if="!hideBar"
        class="facet-option-bar-container"
        :class="disabled"
    >
      <div
          class="facet-option-bar-bar "
          :class="{selected: isChecked, 'green': isChecked && colorful}"
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
    indent: Boolean,
    hideBar: Boolean,
    hideNumber: Boolean,
    disabled: Boolean,
    colorful: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      // isChecked: this.showChecked,
      isClickedAndWaiting: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
        "searchIsLoading",
        "resultsFilters",
    ]),
     isChecked: {
      get(){
        return this.resultsFilters.map(rf => rf.asStr).includes(this.filter.asStr)
      },
      async set(newVal){
        console.log("set new value for isChecked: ", newVal)
        if (newVal) await this.addInputFilters([this.filter])
        else await this.removeInputFilters([this.filter])
      },
    },
    myColor(){

    },
    showChecked(){
     this.resultsFilters.map(rf => rf.asStr).includes(this.filter.asStr)
    },
    isLoading(){
      return this.isClickedAndWaiting && this.searchIsLoading
    },
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
    ...mapMutations([

    ]),
    ...mapActions([
      "addInputFilters",
      "removeInputFilters",
      "updateTextSearch",
    ]),
    toggleIsChecked() {
      this.isChecked = !this.isChecked
    },
    async click(e){
      this.isClickedAndWaiting = true
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
    searchIsLoading(newVal){
      if (!newVal) this.isClickedAndWaiting = false
    }
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

.disabled {
  opacity: .8;
  filter: grayscale(100%);
}

.facet-option-bar-container {
  width: 20px;
  height: 9px;
  background-color: rgba(0, 0, 0, 0.05);
  flex: none;
  margin-top: 7px;
  margin-left: 5px;
}

.facet-option-bar-bar {
  background-color: rgba(0, 0, 0, .5);
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