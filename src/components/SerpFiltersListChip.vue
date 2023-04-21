<template>
  <v-menu
      offset-y
      :close-on-content-click="false"
      ref="menu"
  >
    <template v-slot:activator="{on}">
      <v-chip large close
              :text-color="myTextColor"
              :disabled="disabled"
              v-on="on"

              :color="myColor"
              @click:close="remove"
              class="ma-1 inline-flex py-2"
              style="height: unset;  border: 1px solid !important; border-radius: 3px;"
              close-icon="mdi-close"
      >
        <!--              @click="clickHandler"-->
        <!--          style="height: unset; border-radius: 3px; border: 1px solid !important;"-->

        <!--    <v-icon>{{ filter.icon }}</v-icon>-->
        <!--    <span class="ml-1 mr-1 font-weight-bold">{{ filter.displayName }}: </span>-->
        <!--    <span>{{ myDisplayValue | truncate(50) }}</span>-->


        <v-icon
            class=""
            style="font-size: 22px;"
        >
          {{ filter.icon }}
        </v-icon>
        <div class="display-name ml-2 font-weight-bold" v-if="filter.showNameInChip">{{ filter.displayName }}:</div>
        <div class="mx-3" style="line-height: 1;">
          <!--            <div class="caption">-->
          <!--              <span class="font-weight-bold" v-if="isNegated">NOT</span>-->
          <!--              {{ filter.displayName }}-->
          <!--            </div>-->
          <div class="filter-value" :class="{isNegated}">
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
      <v-toolbar dense flat>
        <v-toolbar-title>
          <v-icon left>
            {{ filter.icon }}
          </v-icon>
          <span class="">{{ filter.displayName }}</span>
        </v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="$refs.menu.save()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
      </v-toolbar>
      <div class="px-3">
        <div>
          {{ filter.displayValue }}
        </div>
        <div class="caption grey--text">
          {{ filter.value }}
        </div>
      </div>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="remove">
          Remove
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../url";

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
    ]),
    myDisplayValue() {
      if (this.filter.isBoolean) {
        const booleanInt = (this.filter.value) ? 1 : 0;
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
      return (this.filter.isNegated) ? "red darken-2" : "green darken-3"
    },
    myColor() {
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
    clickHandler() {
      this.setFacetZoom(this.filter.key)
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
  //text-decoration: line-through;
}
</style>