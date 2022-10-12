<template>
  <v-list-item
      class="pb-2 my-0 d-flex filter-list-item align-start"
      @[mainEventHandler].stop="click($event)"
      :disabled="disableOnSelection && isSelected"
  >

    <!--      <v-btn-->
    <!--          icon-->
    <!--          small-->
    <!--          class="pa-0 ma-0 mr-3"-->
    <!--          :color="(isSelected) ? 'green ' : null"-->
    <!--          @click="click($event)"-->
    <!--          :loading="isLoading"-->
    <!--      >-->
    <!--        <v-icon small v-if="isSelected">mdi-checkbox-marked-circle</v-icon>-->
    <!--        <v-icon v-else small style="opacity: .5">mdi-plus</v-icon>-->
    <!--      </v-btn>-->

    <div class="icon-area">
      <v-progress-circular
          v-if="isLoading"
          size="20"
          width="7"
          indeterminate
          style="margin: 5px 13px 4px 5px;"
          class="ml-1">
      </v-progress-circular>

<!--      Not loading-->
      <template v-else>
        <v-checkbox
            v-if="iconCheck"
            dense
            hide-details
            class="pa-0 ma-0 mr-0"
            :color="(colorful) ? 'green ' : '#999'"
            on-icon="mdi-checkbox-marked-circle"
            off-icon="mdi-plus"
            readonly
            @click.stop="click($event)"
            :input-value="isSelected"
            :disabled="disabled"
        />

        <v-progress-circular
            v-else
            size="20"
            width="7"
            rotate="-90"
            style="margin: 5px 13px 4px 5px; opacity: .9;"
            :value="filter.countPercent"
            class="ml-1">
        </v-progress-circular>

      </template>


    </div>
    <v-list-item-content>
      <div
          class="body-1 "
          style="line-height: 1.5;"
          :class="{'font-weight-bold': isSelected && colorful, disabled}"
      >
        <router-link
            v-if="filter.isEntity"
            :to="filter.value | entityZoomLink"
            class="hover-underline"
            style="color: #333;"
            :class="{'green--text': isSelected && colorful}"
            v-html="prettyDisplayName"
        >
        </router-link>
        <span
            v-else
            class="text--"
            :class="{'green--text': isSelected && colorful}"
            v-html="prettyDisplayName"
        >
        </span>
      </div>

      <div v-if="!hideNumber"
           class="body-2 grey--text"
           :class="{disabled}"
      >
        {{ filter.count.toLocaleString() }}
      </div>
    </v-list-item-content>


  </v-list-item>
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
    // required
    filter: Object,

    iconCheck: Boolean,
    disableOnSelection: Boolean,

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
    mainEventHandler(){
      return (this.disableOnSelection) ? "click" : null
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
  min-height: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;

  .v-list-item__icon {
    margin: 0 !important;
  }

  .v-list-item__content {
    padding: 0 !important;
  }

  &.has-focus {
    background-color: #3d3d3d !important;
  }
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