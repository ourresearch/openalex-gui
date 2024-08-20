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
        <v-btn
            text
            rounded
            v-on="on"
            :color="query.summarize ? 'primary' : null"
            class="px-2"
        >
<!--            style="font-size: 20px !important;"-->
          <template v-if="!query.summarize_by">
            <template v-if="query.summarize">everything</template>
            <template v-else>none</template>
          </template>
          <span class="font-weight-bold ml-2" v-else>by {{ query.summarize_by | pluralize(1) }}</span>
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-subheader>Summarize by</v-subheader>
        <v-list-item-group v-model="selected">
          <v-list-item
              v-for="(entity, i) in entities"
              :key="i"
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
    <v-btn small v-if="query.summarize" icon @click="setSummarize(false)">
      <v-icon small>mdi-close</v-icon>
    </v-btn>
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
      return [
        {id: "all", displayName: "Everything", icon: "mdi-file-document-outline"},
          ...Object.values(getConfigs())
      ]
    },
    selected: {
      get() {
        return this.query.summarize_by
      },
      set(value) {
        this.setSummarize(value)
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
      "setSummarize",
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