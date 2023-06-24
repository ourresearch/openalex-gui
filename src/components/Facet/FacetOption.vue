<template>
  <v-list-item
          class=""
          :input-value="isSelected"
          :disabled="disabled"
          :color="myColor"
          :dark="isSelected"
          @click.exact="exactClickListItem"
          @click.alt="altClickListItem"
          @click.meta="metaClickListItem"
          @click.ctrl="metaClickListItem"
          :class="{isNegated,}"
  >
    <!--    @[eventHandlerName].stop="exactClickListItem($event)"-->

    <!--    <div class="icon-area mr-1 mt-2">-->
    <!--      <v-icon v-if="isNegated">mdi-minus-circle-outline</v-icon>-->
    <!--      <v-icon v-else-if="isSelected">mdi-check-circle-outline</v-icon>-->
    <!--      <v-icon v-else style="opacity: .3">mdi-circle-outline</v-icon>-->
    <!--    </div>-->

    <v-list-item-icon>
      <v-progress-linear
              :value="filter.countPercent"
              reverse
              height="10"
              class="mt-2"
      />
    </v-list-item-icon>
    <v-list-item-content class="pa-0">
      <v-list-item-title>
        <span
                class="facet-option-text"
                v-html="prettyDisplayName"
        >
        </span>

      </v-list-item-title>
    </v-list-item-content>
      <v-list-item-action-text>
        {{ filter.count | toPrecision }}

      </v-list-item-action-text>
  </v-list-item>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {prettyTitle} from "../../util";
import {createSimpleFilter, copySimpleFilter} from "../../filterConfigs";
import {facetConfigs} from "../../facetConfigs";

export default {
    name: "FacetOption",
    components: {},
    props: {
        // required
        filter: Object,

        isSelected: Boolean,
        isNegated: Boolean,

        isBoolean: Boolean,
    },
    data() {
        return {}
    },
    computed: {
        ...mapGetters([
            "searchApiUrl",
            "resultsFilters",
        ]),
        myColor() {

            if (this.isNegated) return "red"
            return "green "
        },
        disabled() {
            return this.filter.count === 0;
        },
        myFilter() {
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
            "updateTextSearch",
        ]),
        exactClickListItem() {
            this.$emit("add-filter", this.filter)
        },
        altClickListItem() {
            const newFilter = copySimpleFilter(this.filter, {isNegated: true})
            newFilter.isNegated = true
            this.$emit("add-filter", newFilter)
        },

        metaClickListItem() {
            this.$emit("add-filter-persistent", this.filter)
        },
    },

    created() {
    },
    async mounted() {
    },
    watch: {}
}
</script>

<style scoped lang="scss">


.facet-option {
  //min-height: 0 !important;
  //margin-bottom: 0 !important;
  //padding-top: 4px !important;
  //padding-bottom: 4px !important;

  &.isNegated {
    .facet-option-text {
      text-decoration: line-through;

    }
  }

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