<template>
  <span class="d-inline-flex align-center">
<!--    <v-autocomplete-->
<!--        class="ml-2"-->
<!--        v-model="selected"-->
<!--        :items="entities"-->
<!--        item-text="displayName"-->
<!--        item-value="id"-->
<!--        placeholder="Summarize by"-->
<!--        label="Summarize by"-->
<!--        hide-details-->
<!--        clearable-->
<!--        rounded-->
<!--        filled-->
<!--        dense-->
<!--    />-->




    <v-menu max-height="33vh" rounded offset-y>
      <template v-slot:activator="{ on }">
        <v-chip
            v-on="on"
            :color="query.summarize_by ? 'primary' : null"
            class="ml-2"
        >
          by
          <template v-if="!query.summarize_by">...</template>
          <span class="font-weight-bold ml-2" v-else>{{ query.summarize_by | pluralize(1) }}</span>
          <v-icon right>mdi-menu-down</v-icon>
        </v-chip>
      </template>

      <v-list>
        <v-subheader>Summarize by</v-subheader>
        <v-list-item-group v-model="selected">
          <v-list-item
              v-for="entity in entities"
              :key="entity.id"
              :value="entity.id"
              active-class="primary--text"
          >
            <v-list-item-icon>
              <v-icon>{{ entity.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ entity.displayName | pluralize(1) }}</v-list-item-title>
            <v-list-item-icon v-if="selected === entity.id">
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>

        </v-list-item-group>
      </v-list>
    </v-menu>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {},
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
    entities() {
      return Object.values(getConfigs())
    },
    selected: {
      get() {
        return this.query.summarize_by
      },
      set(value) {
        this.setSummarizeBy(value)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    ...mapActions("search", [
      "setSummarizeBy",
    ]),


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