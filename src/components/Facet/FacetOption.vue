<template>
  <v-list-item
      class=" my-0 facet-option align-start pr                                 -1"
      :input-value="isSelected"
      :disabled="disabled"
      :color="myColor"
      @click.exact="exactClickListItem"
      @click.alt="altClickListItem"
      light
  >
    <!--    @[eventHandlerName].stop="setSelected($event)"-->

    <div class="icon-area mr-1 mt-2">
      <v-icon v-if="isNegated">mdi-minus-circle-outline</v-icon>
      <v-icon v-else-if="isSelected">mdi-check-circle-outline</v-icon>
      <v-icon v-else style="opacity: .3">mdi-circle-outline</v-icon>
    </div>
    <div>
      <div
          class="body-1 mt-2 "
          style="line-height: 1.5;"
          :class="{'font-weight-bold': isSelected}"
      >
        <span
            v-html="prettyDisplayName"
        >
        </span>
      </div>

      <div
           class="body-2 grey--text"
      >
        {{ filter.count | toPrecision }}
      </div>
    </div>
    <v-spacer/>
    <div>
      <v-menu v-if="!isBoolean" offset-y :close-on-content-click="true">
        <template v-slot:activator="{on}">
          <v-btn
              v-on="on"
              icon
              class=""
              style="opacity: .8;"
              :disabled="disabled"

          >
            <v-icon small>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
              :to="filter.value | entityZoomLink"
              v-if="filter.isEntity"
          >
            <v-list-item-icon>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-title >
              View <span class="text-lowercase">{{ filter.displayName }}</span> details
            </v-list-item-title>
          </v-list-item>
          <v-divider v-if="filter.isEntity"></v-divider>
          <v-list-item
              @click="setSelected({select: true})"
              v-if="!isSelected || isNegated"
              :input-value="true"
              color="green"
          >
            <v-list-item-icon>
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Apply filter
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              @click="setSelected({select: true, negate: true})"
              :disabled="isNegated"
              color="red"
              :input-value="true"
              v-if="!isNegated"
          >
            <v-list-item-icon>
              <v-icon>mdi-minus</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Negate filter
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              @click="setSelected({select: false, negate: false})"
              v-if="isSelected"
          >
            <v-list-item-icon>
              <v-icon>mdi-close</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Clear filter
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </v-list-item>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {prettyTitle} from "../../util";
import {createSimpleFilter} from "../../filterConfigs";
import {facetConfigs} from "../../facetConfigs";

export default {
  name: "FacetOption",
  components: {},
  props: {
    // required
    filter: Object,

    disabled: Boolean,
    isSelected: Boolean,
    isNegated: Boolean,

    isBoolean: Boolean,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
    ]),
    myColor() {
      if (!this.isSelected) return ""
      if (this.isNegated) return "red"
      return "green "
    },
    myFilter(){
      return createSimpleFilter(
          this.entityType,
          this.filter.key,
          this.filter.value,
          this.isNegated
      )
    },
    prettyDisplayName() {
      if (this.filter.isBoolean) {
        const valueAsInt = (this.filter.value === "true") ? 1 : 0;
        return this.filter.booleanValues[valueAsInt]
      }

      if (!this.filter.displayValue) return ""

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
    exactClickListItem(){
      const opts = {
        negate: false,
        // select: (this.isNegated) ? true : !this.isSelected
        select:  !this.isSelected
      }
      return this.setSelected(opts)
    },
    altClickListItem(){
      if (this.isBoolean) return
      const opts = {
        negate: true,
        select:  true
      }
      return this.setSelected(opts)
    },

    setSelected(opts) {
      this.$emit("set-value", {
        isSelected: !!opts.select,
        isNegated: !!opts.negate,
        kv: this.filter.kv
      })
    },
  },

  created() {
  },
  async mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">


.facet-option {
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