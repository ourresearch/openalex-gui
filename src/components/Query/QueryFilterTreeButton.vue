<template>
    <v-menu rounded offset-y v-model="isMenuOpen" class="inline-block">
      <template v-slot:activator="{ on }">
        <v-btn
            v-on="on"
            :class="{'add-filter': true, 'with-filters': withExistingFilters }"
            small       
        >
          <v-icon color="primary" small>mdi-plus</v-icon>Filter
        </v-btn>
      </template>
      <v-card flat rounded v-if="isMenuOpen">
        <v-text-field
            v-model="search"
            filled
            rounded
            background-color="white"
            prepend-inner-icon="mdi-magnify"
            hide-details
            autofocus
            placeholder="Search filters"
            style=""
        />
        <v-divider/>

        <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
          <v-list-item
              v-for="(column, i) in filteredFilters"
              :key="column.id"
              :class="lineBetweenPopularIndex === i ? 'line-above' : ''"
              @click="$emit('addFilter', column.id, column.type)"
          >
            <v-list-item-icon>
              <v-icon>{{ column.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ column.displayName | titleCase }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";
import {ordinalize} from "../../util";


export default {
  name: "QueryFilterTreeButton",
  components: {},
  props: {
    parentId: {
      type: [String, null],
    },
    subjectEntity: String,
    nameWorks: Boolean,
    withExistingFilters: Boolean,
  },
  data() {
    return {
      search: "",
      isMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
    availableFilters() {
      const mySubjectEntity = this.subjectEntity
      const myConfig = getConfigs()[mySubjectEntity]
      const myPossibleColumns = Object.values(myConfig.columns)

      //console.log(myPossibleColumns)

      const availableFilters = myPossibleColumns.filter( f => {
        if  (!f.actions) {console.log(f.displayName + " / " + f.id + " missing 'actions'"); return false}
        return f.actions.includes("filter")
      })
      
      return availableFilters
    },
    popularFilters() {
      return this.availableFilters.filter( f => {
        return (f.actionsPopular && f.actionsPopular.includes("filter"))
      })
    },
    nonpopularFilters() {
      return this.availableFilters.filter( f => {
        return (!f.actionsPopular || !f.actionsPopular.includes("filter"))
      })
    },
    filteredPopularFilters() {
      return this.filterFiltersBySearch(this.popularFilters)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName))
    },
    filteredNonpopularFilters() {
      return this.filterFiltersBySearch(this.nonpopularFilters)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName))
    },
    filteredFilters() {
      return this.filteredPopularFilters.concat(this.filteredNonpopularFilters)
    },
    lineBetweenPopularIndex() {
      // Location of the line between popular filters at top and remaining filters below, if any
      return (this.filteredPopularFilters.length === 0 
              || this.filteredNonpopularFilters.length === 0)
        ? -1
        : this.availableFilters.length > 5 ? this.filteredPopularFilters.length : -1
    }, 
  },
  methods: {
    filterFiltersBySearch(columns) {
      //console.log(columns)
      return columns.filter( f => {
        return f.displayName.toLowerCase().includes(this.search.toLowerCase())
      })
    },  
  },
  created() {
  },
  mounted() {
  },
  watch: {
    isMenuOpen(newValue) {
      if (!newValue) {
        this.search = ""
      }
    }
  }
}
</script>


<style scoped lang="scss">
.line-above {
  border-top: 1px #DDD solid;
}
.inline-block {
  display: inline-block;
}
.add-filter {
  margin-top: 4px;
  margin-left: 16px;
}
.add-filter.with-filters {
  margin-top: 8px;
  margin-left: 20px;
}
</style>