<template>
  <span>
    <v-dialog
        v-model="isOpen"
        max-width="800"
        style="box-shadow: none;"

    >
        <v-card rounded flat class="d-flex align-center px-3">
          <span class="grey--text text-h5">
              The work
              </span>

          <span  class="mx-2 my-2">
            <v-menu rounded>
              <template v-slot:activator="{on}">
                <v-chip  class="text-h5"  v-on="on">
                  {{ myValue ? "is" : "is not" }}
                  <v-icon right>mdi-menu-down</v-icon>
                </v-chip>
              </template>
              <v-list class="text-h5">
                <v-list-item @click="submit(true)" class="py-3">
                  <div style="min-width: 40px;">
                    <v-icon size="30"  v-if="myValue">mdi-check</v-icon>
                  </div>
                  <div>
                      is
                  </div>
                </v-list-item>
                <v-list-item @click="submit(false)" class="py-3">
                  <div style="min-width: 40px;">
                    <v-icon size="30"  v-if="!myValue">mdi-check</v-icon>
                  </div>
                  <div>
                      is not
                  </div>
                </v-list-item>
              </v-list>

            </v-menu>

          </span>
          <span class="text-h5">
            {{ myFilterConfig.displayName }}
          </span>
          <v-spacer />
          <v-btn large icon class="" @click="deleteMe">
            <v-icon large>mdi-delete-outline</v-icon>
          </v-btn>
        </v-card>

     </v-dialog>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    value: Boolean,
    filterKey: String,
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
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    myValue: {
      get(){
        return url.readFilterValue(this.$route, this.entityType, this.filterKey)
      },
      set(to) {
        url.upsertFilter(this.entityType, this.filterKey, !!to)
      }
    },
    isOpen: {
      get(){
        return this.value
      },
      set(to){
        this.$emit("input", to)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    submit(newVal) {
      this.myValue = newVal
      this.isOpen = false
    },
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen: {
      immediate: true,
      handler(to, from) {
        this.searchString = url.readFilterValue(this.$route, this.$store.state.entityType, this.filterKey)
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>