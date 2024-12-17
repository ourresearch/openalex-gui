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
    <v-menu max-height="70vh" rounded offset-y>
      <template v-slot:activator="{ on }">
        <v-btn
            rounded
            v-on="on"
            class="text-h6 "
        >
         <!-- <v-icon left>{{ querySubjectEntityConfig?.icon || "mdi-file-document" }}</v-icon>-->
          <span class=" text-capitalize">
            <template v-if="query.get_rows === 'summary'">
               Works Summary
            </template>
            <template v-else>
              {{ query.get_rows  }}
            </template>
          </span>
<!--          <span class="font-weight-regular ml-1">-->
<!--            results-->
<!--          </span>-->
          <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item-group v-model="selected">
           <v-list-item
               :value="false"
               active-class="primary--text"
           >
            <v-list-item-icon>
              <v-icon>mdi-file-document-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Works</v-list-item-title>
             <!--            <v-list-item-icon v-if="selected === entity.id">-->
             <!--              <v-icon>mdi-check</v-icon>-->
             <!--            </v-list-item-icon>-->
          </v-list-item>
           <v-list-item
               value="summary"
               active-class="primary--text"
           >
            <v-list-item-icon>
              <v-icon>mdi-file-document</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Works Summary</v-list-item-title>
             <!--            <v-list-item-icon v-if="selected === entity.id">-->
             <!--              <v-icon>mdi-check</v-icon>-->
             <!--            </v-list-item-icon>-->
          </v-list-item>

          <v-subheader>Summarize works by:</v-subheader>
          <v-divider/>
          <v-list-item
              v-for="(entity, i) in entities"
              :key="i"
              :value="entity.id"
              active-class="primary--text"
          >
            <v-list-item-icon>
              <v-icon>{{ entity.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="text-capitalize">{{ entity.displayName }}</v-list-item-title>
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
  name: "QuerySummarizeBy",
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
      "querySubjectEntityConfig",
    ]),
    entities() {
      return Object.values(getConfigs())
    },
    selected: {
      get() {
        return this.query.get_rows
      },
      set(value) {
        this.setSummarize(value)

      }
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    ...mapActions("search", [
      "setSummarize",
      "createSearch",
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