<template>
    <v-menu rounded offset-y>
      <template v-slot:activator="{ on }">
        <v-btn
            icon
            v-on="on"
            color="primary"
            class="px-1"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-card flat rounded>
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
              v-for="column in newFilterColumnOptions"
              :key="column.id"
              @click="$emit('addFilter', column.id)"
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
  name: "Template",
  components: {},
  props: {
    parentId: {
      type: [String, null],
    },
    subjectEntity: String,
  },
  data() {
    return {
      foo: 42,
      search: "",
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
    newFilterColumnOptions() {
      const mySubjectEntity = this.subjectEntity
      const myConfig = getConfigs()[mySubjectEntity]
      const myPossibleColumns = Object.values(myConfig.columns)

      return myPossibleColumns.filter( f => {
        return f.displayName.toLowerCase().includes(this.search.toLowerCase())
      })
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>