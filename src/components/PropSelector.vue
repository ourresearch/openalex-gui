<template>
  <v-card rounded height="66vh">
    <v-toolbar height="60" flat>
      <v-toolbar-title>
        More
        {{ action }}
        options
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
          filled
          dense
          rounded
          class="mt-0"
          v-model="q"
          placeholder="Search"
          append-icon="mdi-magnify"
          hide-details
      ></v-text-field>

      <v-btn icon @click="close">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>
    <div style="position: absolute; top: 61px;" :style="{width: sidebarWidth+'px'}">
      <v-list rounded>

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
    <v-card-text
        class="d-flex"
        id="prop-selector"
        style="flex-grow: 99999999999 !important;"
    >
      <div :style="{width: sidebarWidth+'px'}" class="flex-shrink-0">
<!--        spacer-->
      </div>
      <div class="flex-grow-1">
        <div
            v-for="category in propsByCategory"
            :key="category.id"
            :id="category.id + '-section'"
            class="pb-6 pt-3"
        >
          <div class="text-h5 text-capitalize pb-2">{{ category.displayName }}</div>
          <div class="d-flex flex-wrap">
            <div
                v-for="prop in category.props"
                :key="prop.id"
                class="mb-2 mr-2"
            >
              <v-chip
                  label
                  :disabled="prop.isDisabled"
                  @click="select(prop.id)"
              >
                <v-icon small left v-if="prop.isDisabled">mdi-check</v-icon>
                {{ prop.displayName }}

              </v-chip>
            </div>
          </div>

        </div>
        <div class="py-12 my-12"></div>
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
    subjectEntity: String,
    action: String,
    idsToDisable: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  data() {
    return {
      foo: 42,
      sidebarWidth: 250,
      q: "",
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    filteredProps() {
      if (!this.subjectEntity) return []
      return Object.values(oaxConfigs[this.subjectEntity].properties)
          .filter(p => {
            return p.displayName.toLowerCase().includes(this.q.toLowerCase())
          })
          .filter(p => {
            return p.actions?.includes(this.action)
          })
          .map(p => {
            return {
              ...p,
              isDisabled: this.idsToDisable?.includes(p.id)
            }
          })
    },
    propCategories() {
      const categories = this.filteredProps.map(prop => prop.category)
      return [...new Set(categories)].map(name => {
        if (!name) name = "uncategorized"
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
          props: this.filteredProps.filter(prop => prop.category === cat.displayName)
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
    close() {
      this.q = ""
      this.$emit('close')
    },
    select(id){
      this.q = ""
      this.$emit('select', id)

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