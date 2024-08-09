<template>
  <v-card rounded height="66vh">
    <v-toolbar height="55">Select</v-toolbar>
    <div style="position: absolute; top: 55px;" :style="{width: sidebarWidth+'px'}">
      <v-list>
        <v-list-item
            v-for="cat in propCategories"
            :key="cat.id"
            @click="$vuetify.goTo(`#${cat.id}-section`, {container: '#prop-selector'})"

        >
          <v-list-item-content>
            <v-list-item-title>{{ cat.displayName }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </div>
    <v-card-text class="d-flex" id="prop-selector">
      <div :style="{width: sidebarWidth+'px'}" class="flex-shrink-0">
        spacer
      </div>
      <div class="flex-grow-1">
        <div
            v-for="category in propsByCategory"
            :key="category.id"
            :id="category.id + '-section'"
        >
          <div class="text-h5">{{ category.displayName }}</div>
          <div class="d-flex flex-wrap">
            <div
                v-for="prop in category.props"
                :key="prop.id"
                class="ma-2"
            >
              {{ prop.displayName }}
            </div>
          </div>

        </div>
      </div>

    </v-card-text>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {oaxConfigs} from "@/oaxConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    entityType: String,
  },
  data() {
    return {
      foo: 42,
      sidebarWidth: 200,
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    propCategories() {
      const categories = Object.values(oaxConfigs[this.entityType].properties).map(prop => prop.category)
      return [...new Set(categories)].map(name => {
        if (!name) name = "Uncategorized"
        return {
          displayName: name,
          id: name.replace(" ", "-")
        }
      })
    },
    propsByCategory() {
      return this.propCategories.map(cat => {
        return {
          ...cat,
          props: Object.values(oaxConfigs[this.entityType].properties).filter(prop => prop.category === cat.displayName)
        }
      })
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
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