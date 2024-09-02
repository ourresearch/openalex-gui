<template>
  <div class="d-flex align-center flex-grow-1">
      <div class="grey--text" v-if="filter.children.length === 0">
        an empty subquery
      </div>
      <div v-else-if="filter.children.length === 1">
        1 subfilter
      </div>
      <div v-else class="d-flex align-baseline">
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
                outlined
                text
                v-on="on"
                class="px-1 mr-1"
                style="min-width: 1px !important; min-height: 1px;"
            >
              {{ selectedOperator === "and" ? "all" : "any" }}
              <v-icon small>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item-group v-model="selectedOperator">
              <v-list-item
                  v-for="operator in ['and', 'or']"
                  :key="operator"
                  :value="operator"
                  @click="toggleBranchFilterOperator"
                  active-class="primary--text"
              >
                <v-list-item-title class="py-3">
                  {{ operator === "and" ? "all" : "any" }}
                  ({{ operator }})
                </v-list-item-title>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
        <template v-if="isOpen">
          of these {{ filter.children.length - 1 }} subfilters
        </template>
        <template v-else>
          of {{ filter.children.length - 1 }} hidden subfilters
        </template>
        {{ selectedOperator === "and" ? "are" : "is" }} true{{ isOpen ? ": " : "" }}
      </div>
    <!--    <v-spacer></v-spacer>-->
    <!--    <v-chip-->

    <!--        @click.stop="toggleBranchFilterOperator"-->
    <!--        v-if="filter.children.length > 2 && !filter.isRoot"-->
    <!--        outlined-->
    <!--        class="mr-1"-->
    <!--    >-->
    <!--        {{ filter.operator }}-->
    <!--    </v-chip>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {operation} from "retry";

export default {
  name: "Template",
  components: {},
  props: {
    filter: Object,
    isOpen: Boolean,

  },
  data() {
    return {
      foo: 42,
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
    selectedOperator: {
      get() {
        return this.filter.operator
      },
      set(value) {
        this.setOperator(value)
      }
    }
  },

  methods: {
    operation,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", []),
    ...mapActions("user", []),

    toggleBranchFilterOperator() {
      console.log("toggleBranchFilterOperator", this.filter)
      this.$emit("setOperator", {
            id: this.filter.id,
            operator: this.filter.operator === "and" ? "or" : "and"
          }
      )
    },
    setOperator(operator) {
      console.log("setOperator", operator)
    }

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