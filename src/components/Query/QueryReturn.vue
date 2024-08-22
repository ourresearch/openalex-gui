<template>
  <div>
    <v-list>
        <v-list-item
              v-for="option in options"
              :key="option.id"
              @click="clickListItem(option.id)"
          >
            <v-list-item-icon>
              <v-icon>{{ option.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ option.displayName | pluralize(1) }}</v-list-item-title>
<!--            <v-list-item-icon v-if="selected.includes(option.id)">-->
<!--              <v-icon>mdi-check</v-icon>-->
<!--            </v-list-item-icon>-->
          </v-list-item>

    </v-list>

<!--    <v-autocomplete-->
<!--        class="ml-2"-->
<!--        v-model="selected"-->
<!--        :items="options"-->
<!--        item-text="displayName"-->
<!--        item-value="id"-->
<!--        placeholder="Add column"-->
<!--        label="Add column"-->
<!--        hide-details-->
<!--        clearable-->
<!--        rounded-->
<!--        filled-->
<!--        dense-->
<!--        @input="handleInput"-->
<!--        ref="QueryReturnAutocomplete"-->
<!--    />-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    index: Number
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
        "querySubjectEntityConfig",
        "querySubjectEntity",
    ]),
    // selected: {
    //   get() {
    //     return this.query.return
    //   },
    //   set(value) {
    //     // this.handleInput(value)
    //     console.log("selected set", value)
    //     this.addReturnColumn(value.id)
    //   }
    //
    // },
    options() {
      if (!this.querySubjectEntity) {
        return []
      }
      return Object.values(this.querySubjectEntityConfig.columns)
          .filter(col => {
            return col.actions?.includes("column")
          })
          .filter(col => {
            return !this.query.return_columns.includes(col.id)
          })
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", [
      "toggleSummarize",
      "toggleSortByDirection",
    ]),
    ...mapActions("search", [
      "addReturnColumn",
    ]),
    ...mapActions("user", []),
    clickListItem(id) {
      this.addReturnColumn(id)
      this.$emit("close")
    }

    // handleInput(value) {
    //   console.log("handleInput", value)
    //   this.addReturnColumn(value)
    //   this.$nextTick(() => {
    //     this.selected = null
    //     // Remove focus from the autocomplete
    //     if (this.$refs.QueryReturnAutocomplete) {
    //       this.$refs.QueryReturnAutocomplete.blur()
    //     }
    //   })
    //
    // }


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