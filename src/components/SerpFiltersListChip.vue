<template>
  <div


  >

    <v-menu
            offset-y
            ref="menu"

    >
      <template v-slot:activator="{on}">
        <v-chip large close
                :text-color="myTextColor"
                :disabled="disabled"
                v-on="on"

                :color="myColor"
                @click:close="remove"
                @click.meta.native.prevent.stop.capture="toggleFacetZoom"
                @click.ctrl.native.prevent.stop.capture="toggleFacetZoom"
                @click.alt.native.prevent.stop.capture="toggleNegation"
                class="ma-1 inline-flex py-2"
                style="height: unset;  border: 1px solid !important; border-radius: 3px;"
                close-icon="mdi-close"
        >


          <!--        <v-icon-->
          <!--            class=""-->
          <!--            style="font-size: 22px;"-->
          <!--        >-->
          <!--          {{ filter.icon }}-->
          <!--        </v-icon>-->
          <div class="mr-1" style="line-height: 1;">
            <div class="caption font-weight-bold">
              <span class="font-weight-bold" v-if="isNegated">NOT</span>
              {{ filter.displayName }}:
            </div>
            <div class="filter-value" :class="{isNegated}">
              <!--                                    <span class="font-weight-bold" v-if="isNegated">NOT</span>-->

              <span v-if="filter.valuesToShow==='search'" class="font-weight-bold">
          "{{ myDisplayValue | truncate(30) }}"
        </span>
              <span v-else class="">
        {{ myDisplayValue | truncate(30) }}

        </span>
            </div>
          </div>


        </v-chip>
      </template>
      <v-card max-width="300">
        <div class="px-3 pt-2 pb-1">
          <div class="body-2">{{ filter.displayName }}:</div>
          <div class="font-weight-bold">{{ filter.displayValue }}</div>
          <div v-if="filter.isEntity" class="caption grey--text">{{ filter.value }}</div>

        </div>
        <v-divider/>
        <v-list>

          <v-list-item
                  @click="setFacetZoom(filter.key)"
                  v-if="filter.isSearch"
          >
            <v-list-item-icon>
              <v-icon>mdi-magnify</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Add search
            </v-list-item-title>
          </v-list-item>

          <v-list-item
                  @click="setFacetZoom(filter.key)"
                  v-if="filter.isRange"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-cog-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Edit filter
            </v-list-item-title>
          </v-list-item>

          <v-list-item
                  @click="setFacetZoom(filter.key)"
                  v-if="filter.valuesToShow==='mostCommon' && facetZoom !== filter.key"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-settings-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                View filter menu
              </v-list-item-title>

            </v-list-item-content>
            <v-list-item-action>
              <v-list-item-action-text>⌘+click</v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>

          <v-list-item @click="remove">
            <v-list-item-icon>
              <v-icon>mdi-filter-remove-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Remove filter
            </v-list-item-title>
          </v-list-item>

          <v-list-item
                  @click="toggleNegation"
                  v-if="!filter.isBoolean"
          >
            <v-list-item-icon>
              <v-icon v-if="isNegated">mdi-filter-check-outline</v-icon>
              <v-icon v-else>mdi-filter-minus-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                <span v-if="isNegated">Un-negate filter</span>
                <span v-else>Negate filter</span>
              </v-list-item-title>
            </v-list-item-content>

            <v-list-item-action>
              <v-list-item-action-text>Alt+click</v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>
        </v-list>


      </v-card>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../url";
import {createSimpleFilter} from "@/filterConfigs";

export default {
    name: "Template",
    components: {},
    props: {
        filter: Object,
        disabled: Boolean,

    },
    data() {
        return {
            foo: 42,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
            "facetZoom",
        ]),
        myDisplayValue() {
            if (this.filter.isBoolean) {
                const booleanInt = (this.filter.value === "true") ? 1 : 0;
                console.log("this.filter.isBoolean", this.filter, booleanInt)
                return this.filter.booleanValues[booleanInt]
            }
            return this.filter.displayValue
        },
        dynamicAttribute() {
            return (this.filter.noOptions) ? null : "click"
        },
        isNegated() {
            return this.filter.isNegated
        },
        myTextColor() {
            return "green darken-3"
            return (this.filter.isNegated) ? "red darken-2" : "green darken-3"
        },
        myColor() {
            return "green lighten-5"
            return (this.filter.isNegated) ? "red lighten-5" : "green lighten-5"
        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "setFacetZoom",
        ]),
        ...mapActions([]),
        remove() {
            const newFilters = this.resultsFilters.filter(f => f.asStr !== this.filter.asStr)
            url.setFilters(
                this.entityType,
                newFilters
            )
        },
        toggleNegation() {
            const newFilter = createSimpleFilter(
                this.filter.entityType,
                this.filter.key,
                this.filter.value,
                !this.isNegated
            )

            const newFiltersList = this.resultsFilters.filter(f => f.kv !== this.filter.kv)
            newFiltersList.push(newFilter)
            url.setFilters(
                this.entityType,
                newFiltersList
            )
        },

        toggleFacetZoom() {
            this.setFacetZoom((this.facetZoom === this.filter.key) ? false : this.filter.key)
        }


    },
    created() {
    },
    mounted() {
    },
    watch: {
        isOpen(to, from) {
        }
    }
}
</script>

<style scoped lang="scss">
.filter-value.isNegated {
  text-decoration: line-through;
}
</style>