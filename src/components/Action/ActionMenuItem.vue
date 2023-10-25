<template>
  <div>

    <v-menu rounded offset-y :close-on-content-click="false">
      <template v-slot:activator="{on}">
        <v-btn text rounded v-on="on" class="">
          {{ myConfig.displayName }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item-group v-model="selected" multiple>
          <!--          <v-subheader>Selected</v-subheader>-->
          <v-list-item
              v-for="config in selectedOptionsConfigs"
              :key="config.key"
              :value="config.key"
              :disabled="config.isColumnMandatory"
          >
            <v-list-item-icon>
              <v-icon>{{ config.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ config.displayName }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon>
              <v-icon v-if="selected.includes(config.key)">mdi-checkbox-marked</v-icon>
              <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
            </v-list-item-icon>
          </v-list-item>


          <v-divider/>
          <v-list-item
              v-for="config in unselectedOptionsConfigs"
              :key="config.key"
              :value="config.key"
              :disabled="config.isColumnMandatory"
          >
            <v-list-item-icon>
              <v-icon>{{ config.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ config.displayName }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon>
              <v-icon v-if="selected.includes(config.key)">mdi-checkbox-marked</v-icon>
              <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
            </v-list-item-icon>
          </v-list-item>


        </v-list-item-group>

      </v-list>


      <v-list v-if="0">

        <v-list-item
            v-for="config in selectedValueConfigs"
            :key="config.key"
            :value="config.key"

        >
          <v-list-item-icon>
            <v-icon>{{ config.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ config.displayName }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="isDefault(config.key) && !config.isColumnMandatory">
              Default
            </v-list-item-subtitle>

          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon :disabled="config.isColumnMandatory" @click="removeValue(config.key)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
          <!--        <v-list-item-icon>-->
          <!--          <v-icon v-if="config.isColumnMandatory">mdi-pin</v-icon>-->
          <!--          <v-icon v-else>mdi-checkbox-marked</v-icon>-->
          <!--        </v-list-item-icon>-->
        </v-list-item>
        <v-divider/>
        <v-list-item
            v-for="config in unselectedValueConfigs"
            :key="config.key"
            :value="config.key"
        >
          <!--          @click="addValue(config.key)"-->
          <v-list-item-icon>
            <v-icon>{{ config.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ config.displayName }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="isDefault(config.key)">
              Default
            </v-list-item-subtitle>

          </v-list-item-content>
          <!--        <v-list-item-icon>-->
          <!--          <v-icon>mdi-checkbox-blank-outline</v-icon>-->
          <!--        </v-list-item-icon>-->

          <v-list-item-action>
            <v-btn icon @click="addValue(config.key)">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-list-item @click="isDialogOpen = true" key="more-items">
          <v-list-item-content>
            <v-list-item-title>More...</v-list-item-title>
          </v-list-item-content>
        </v-list-item>


      </v-list>

    </v-menu>
    <v-dialog scrollable model="isDialogOpen">
      <action-add-value-dialog/>
    </v-dialog>
  </div>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetsByCategory, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import {getActionConfig, getActionDefaultValues} from "@/actionConfigs";
import ActionAddValueDialog from "@/components/Action/ActionAddValueDialog.vue";


export default {
  name: "Template",
  components: {
    ActionAddValueDialog,
  },
  props: {
    action: String,
    disabled: Boolean,
  },
  data() {
    return {
      isDialogOpen: false,
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),


    selected: {
      get() {
        return url.getActionValueKeys(this.$route, this.action)
      },
      set(to) {
        url.setActionValueKeys(this.action, to)
      }
    },
    // selectedConfig(){
    //   if (!this.selected) return
    //   return getFacetConfig(this.entityType, this.selected)
    // },
    selectedOptions() {
      return url.getActionValueKeys(this.$route, this.action)
    },
    selectedOptionsConfigs() {
      return this.selectedOptions.map(k => {
        return getFacetConfig(this.entityType, k)
      })
    },
    unselectedOptions() {
      return getActionConfig(this.action).topValues.filter(k => {
        return !this.selected?.includes(k)
      })
    },
    unselectedOptionsConfigs() {
      return this.unselectedOptions.map(k => {
        return getFacetConfig(this.entityType, k)
      })
          .filter(conf => {
            return url.isSearchFilterApplied() || conf.type !== "search"
          })
    },


    myConfig() {
      return getActionConfig(this.action)
    },
    urlValues() {
      return this.$route.query[this.action]?.split(",")?.filter(x => !!x) ?? []
    },
    urlValueKeys() {
      return this.urlValues.map(val => val.replace(":desc", ""))
    },
    selectedValueConfigs() {
      return this.urlValueKeys.map(k => {
        return getFacetConfig(this.entityType, k)
      })
    },
    unselectedValueConfigs() {
      return this.myConfig.topValues.filter(k => {
        return !this.urlValueKeys.includes(k)
      })
          .map(k => getFacetConfig(this.entityType, k))
          .filter(conf => {
            return url.isSearchFilterApplied() || conf.type !== "search"
            return !(!url.isSearchFilterApplied() && conf.type === "search")
          })
    },

    // selectedConfig() {
    //   if (!this.selected || this.isMultipleSelect) return
    //   return getFacetConfig(this.entityType, this.selected)
    // },
    appendToKeyValues() {
      return (this.action === "sort") ? ":desc" : ""
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    isSelected(key) {
      return this.selected === key || this.selected?.includes(key)
    },
    addValue(key) {
      const myKey = key + this.appendToKeyValues
      const newKeys = [...this.urlValues, myKey]
      const query = {
        ...this.$route.query,
        [this.action]: newKeys.join(","),
      }
      url.pushToRoute(
          this.$router,
          {
            name: "Serp",
            query,
          }
      )
    },
    removeValue(key) {
      if (key === "display_name") return
      console.log("remove value", key)


      let newKeys = this.urlValueKeys.filter(k => {
        return k !== key
      })

      if (this.action === "sort" && newKeys.length === 0) {
        newKeys = getActionDefaultValues(this.action, this.$route.query)
      }

      const query = {
        ...this.$route.query,
        [this.action]: newKeys.map(k => k + this.myConfig.appendToValues).join(",")
        // [this.action]: "publication_year,display_name"
      }

      console.log("removeValue pushing this query", query)

      url.pushToRoute(
          this.$router,
          {
            name: "Serp",
            query,
          }
      )
    },
    isDefault(key) {
      const defaults = getActionDefaultValues(this.action, this.$route.query)
      return defaults.includes(key)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(to) {


      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>