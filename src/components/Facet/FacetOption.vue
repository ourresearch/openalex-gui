<template>
  <v-list-item
      class=" my-0 filter-list-item align-start pt-0 pr-1"
      :input-value="isSelected"
      :disabled="disabled"
      :color="(isSelected && colorful) ? 'green lighten-2' : ''"
      style="margin-top: -5px !important;"
  >
<!--    removed-->
<!--    @[eventHandlerName].stop="click($event)"-->

    <div class="icon-area mr-1 mt-2">
      <v-progress-circular
          v-if="isLoading"
          size="20"
          width="5"
          indeterminate
          style="margin: 4px 12px 0 0;"
      >
      </v-progress-circular>

      <template v-else>

<!--        <v-progress-circular-->
<!--            v-if="hideCheckbox"-->
<!--          size="20"-->
<!--          width="7"-->
<!--          rotate="-90"-->
<!--          style="margin: 0px 12px 0 0; opacity: .9"-->
<!--          :value="filter.countPercent"-->
<!--          :color="isSelected ? 'green lighten-1' : ''"-->
<!--      />-->
      <v-simple-checkbox
          :value="isSelected"
          read-only
          @click="click($event)"
          class="ma-0 pa-0"
          v-ripple
      />
      </template>
    </div>
    <div>
      <div
          class="body-1 mt-2 "
          style="line-height: 1.5;"
          :class="{'font-weight-bold': isSelected}"
      >
        <span
            :class="{'white--text': isSelected && hideCheckbox}"
            class="text--lighten-1"
            v-html="prettyDisplayName"
        >
        </span>
      </div>

      <div v-if="!hideNumber"
           class="body-2 grey--text"
      >
        {{ filter.count | toPrecision }}
      </div>
    </div>
    <v-spacer />
    <div >
      <v-btn
            v-if="filter.isEntity"
            :to="filter.value | entityZoomLink"
            icon
            class=""
            style="opacity: .8;"
            :disabled="disabled"

        >
<!--          <v-icon small>mdi-dots-horizontal</v-icon>-->
<!--          <v-icon small>mdi-open-in-app</v-icon>-->
          <v-icon small :color="(colorful && isSelected) ? 'green lighten-2' : '' ">mdi-eye-outline</v-icon>
<!--          <v-icon small>mdi-folder-open-outline</v-icon>-->
        </v-btn>

    </div>


  </v-list-item>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {prettyTitle} from "../../util";

export default {
  name: "FacetOption",
  components: {},
  props: {
    // required
    filter: Object,

    hideCheckbox: Boolean,

    disabled: Boolean,
    colorful: Boolean,

    hideNumber: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isClickedAndWaiting: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "searchIsLoading",
      "resultsFilters",
    ]),
    isSelected: {
      get() {
        return this.resultsFilters.map(rf => rf.asStr).includes(this.filter.asStr)
      },
      async set(newVal) {
        console.log("set new value for isSelected: ", newVal)

        if (newVal) await this.addInputFilters([this.filter])
        else await this.removeInputFilters([this.filter])
      },
    },
    myColor() {

    },
    eventHandlerName() {
      return (this.hideCheckbox) ? "click" : null
    },
    isLoading() {
      return this.isClickedAndWaiting && this.searchIsLoading
    },
    prettyDisplayName() {
      if (this.filter.isBoolean) {
        const valueAsInt = (this.filter.value === "true") ? 1 : 0;
        return this.filter.booleanValues[valueAsInt]
      }


      let ret = this.filter.displayValue
          .replace("ieee", "IEEE")
          .replace("United States of America", "United States")
          .replace("United Kingdom of Great Britain and Northern Ireland", "United Kingdom")

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
      "addInputFilters",
      "removeInputFilters",
      "updateTextSearch",
    ]),
    async click(e) {
      this.isClickedAndWaiting = true
      this.isSelected = !this.isSelected
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
    searchIsLoading(newVal) {
      if (!newVal) this.isClickedAndWaiting = false
    }
  }
}
</script>

<style scoped lang="scss">


.filter-list-item {
  //min-height: 0 !important;
  //margin-bottom: 0 !important;
  //padding-top: 4px !important;
  //padding-bottom: 4px !important;

  .v-list-item__icon {
    //margin: 0 !important;
  }

  .v-list-item__content {
    //padding: 0 !important;
  }

}

.v-list .v-list-item--active {
  //background: green;
}

a.hover-underline {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.disabled {
  filter: grayscale(100%);
}

.facet-option-bar-container {
  width: 20px;
  height: 11px;
  margin-right: 15px;
  background-color: rgba(0, 0, 0, 0.05);
  flex: none;
  display: inline-flex;
  justify-content: flex-end;
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