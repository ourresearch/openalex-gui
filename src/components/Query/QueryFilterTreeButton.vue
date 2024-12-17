<template>
    <v-menu rounded offset-y v-model="isMenuOpen">
      <template v-slot:activator="{ on }">
        <v-btn
            v-on="on"
            style="margin-left: 16px; margin-top: 8px"
            color="primary"
            outlined
            small
        >
          <v-icon>mdi-plus</v-icon> Add {{nameWorks ? "Works " : ""}}Filter
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

        <v-list class="py-0" style="max-height: calc(50vh - 56px); overflow-y: scroll;">
<!--          <v-list-item-->
<!--              v-if="'subquery multiple'.includes(search.toLowerCase())"-->
<!--              @click="$emit('addBranchFilter', parentId)"-->
<!--          >-->
<!--            <v-list-item-icon>-->
<!--              <v-icon>mdi-filter-multiple-outline</v-icon>-->
<!--            </v-list-item-icon>-->
<!--            <v-list-item-content>-->
<!--              <v-list-item-title>-->
<!--                Subquery-->
<!--                <span class="grey&#45;&#45;text">(multiple filters)</span>-->
<!--              </v-list-item-title>-->
<!--            </v-list-item-content>-->
<!--          </v-list-item>-->
          <v-list-item
              v-for="(column, i) in filteredColumns"
              :key="column.id"
              :class="lineBetweenPopularIndex === i ? 'line-above' : ''"
              @click="$emit('addFilter', column.id, column.type)"
          >
            <v-list-item-icon>
              <v-icon>{{ column.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              {{ column.displayName }}
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
  },
  data() {
    return {
      foo: 42,
      search: "",
      isMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
    ]),
    possibleColumns() {
      const mySubjectEntity = this.subjectEntity
      const myConfig = getConfigs()[mySubjectEntity]
      const myPossibleColumns = Object.values(myConfig.columns)
      return myPossibleColumns
    },
    popularColumns() {
      return this.possibleColumns.filter( f => {
        return (f.actionsPopular && f.actionsPopular.includes("column"))
      })
    },
    nonpopularColumns() {
      return this.possibleColumns.filter( f => {
        return (!f.actionsPopular || !f.actionsPopular.includes("column"))
      })
    },
    filteredPopularColumns() {
      return this.filterColumnsBySearch(this.popularColumns)
    },
    filteredNonpopularColumns() {
      return this.filterColumnsBySearch(this.nonpopularColumns)
    },
    filteredColumns() {
      return this.filteredPopularColumns.concat(this.filteredNonpopularColumns)
    },
    lineBetweenPopularIndex() {
      return (this.filteredPopularColumns.length === 0 
              || this.filteredNonpopularColumns.length === 0)
        ? -1
        : this.filteredPopularColumns.length
    }, 
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),
    filterColumnsBySearch(columns) {
      console.log(columns)
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
</style>