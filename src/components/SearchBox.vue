<template>

  <form class="main-search d-flex">
    <v-combobox
        v-model="select"
        :items="items"
        :search-input.sync="searchString"
        class="mx-3 mb-8"
        solo
        item-text="display_name"
        item-value="id"
        :loading="loading"
        @keyup.enter="submitSearch"
        @input="goToEntityPage"
        autofocus
    >
      <template v-slot:prepend-inner>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
                large
                tile
                class="ma-0 text-capitalize"
                depressed
                v-bind="attrs"
                v-on="on"
            >
              <span>{{ selectedEntityType }}</span>
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
                v-for="entityType in entityTypeOptions"
                :key="entityType.name"
                @click="setSelectedEntityType(entityType.name)"
                class="text-capitalize"
            >
              <span class="mr-2">{{ entityType.icon }}</span>
              <span>{{ entityType.name }}</span>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template v-slot:item="data">
        <v-list-item-icon>
          <span class="our-icon mr-2">{{ data.item.icon }}</span>
        </v-list-item-icon>
        <v-list-item-content>
          <div>
            <!--            <div class="caption text-capitalize">-->
            <!--              {{ data.item.entity_type }}-->
            <!--            </div>-->
            <div>
              {{ data.item.display_name }}
            </div>
          </div>
        </v-list-item-content>
      </template>
    </v-combobox>

  </form>


</template>

<script>
import axios from 'axios'
import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {entityConfigs} from "../entityConfigs";


export default {
  name: "SearchBox",
  props: {
    value: {
      type: String,
      value: "",
    },
    entityType: {
      type: String,
      value: "all",
    },
    allowAllEntities: {
      type: Boolean,
      value: false,
    }
  },
  data: function () {
    const selectedEntityType =this.$store.state.entityType ?? "all"

    return {
      select: this.$store.state.filters["display_name.search"],
      loading: false,
      items: [],
      searchString: "",
      entityConfigs,
      selectedEntityType
    }
  },
  computed: {
    ...mapGetters([]),
    entityTypeOptions() {
      const ret = [...Object.values(entityConfigs)]
      if (this.allowAllEntities) {
        ret.unshift({
          icon: "🌈",
          name: "all"
        })
      }
      return ret
    },
    selectedEntityTypeObject(){
       this.entityTypeOptions.find(e => {
        return e.name === this.selectedEntityType
      })
    },
    displayItems() {
      return this.items.slice(0, 6)
    },
    cleanSearchString() {
      if (!this.searchString) return ""
      return this.searchString.replace(":", " ").replace(",", " ")
    },
    autocompleteUrl() {
      const url = new URL("https://api.openalex.org/autocomplete");
      url.searchParams.set("email", "team@ourresearch.org")
      url.searchParams.set("q", this.searchString)
      if (this.selectedEntityType !== "all") {
        const singularName = this.selectedEntityType.slice(0, -1)
        url.searchParams.set("entity_type", singularName)
      }
      return url.toString()
    }
  },
  methods: {
    ...mapMutations([
      "setEntityType"
    ]),
    ...mapActions([
      "doTextSearch",
    ]),
    setSelectedEntityType(value) {
      this.selectedEntityType = value
      // this.setEntityType(this.selectedEntityType)
      // this.fetchSuggestions(this.searchString)
    },
    submitSearch() {
      if (this.select?.id) {
        console.log("there's a select.id", this.select)
        // take us to an entity page, if possible
        this.goToEntityPage()
      } else {
        const entityTypeForApi = (this.selectedEntityType === "all") ? "works" : this.selectedEntityType;

        this.doTextSearch({
          entityType: entityTypeForApi,
          searchString: this.cleanSearchString,
        })
      }
    },

    goToEntityPage() {
      if (this.select?.id) {
        const shortId = this.select.id.replace("https://openalex.org/", "")
        this.$router.push(`/${this.select.entity_type}/${shortId}`)

      }
    },
    fetchSuggestions(v) {
      if (!this.searchString) {
        this.items = []
        return
      }
      this.loading = true
      axios.get(this.autocompleteUrl)
          .then(resp => {
            if (!this.searchString) {
              console.log("no search string, clearing items")
              this.items = []
            } else this.items = resp.data.results.slice(0, 5).map(i => {
              const pluralEntityType = i.entity_type + "s"
              i.icon = entityConfigs[pluralEntityType].icon
              return i
            })

            this.loading = false
          })
    }
  },
  watch: {
    searchString(val) {
      if (!val) this.items = []
      this.fetchSuggestions(val)
    },
  }
}
</script>

<style lang="scss">
form.main-search {
  width: 100%;

  .v-btn:not(.v-btn--round).v-size--large {
    height: 49px;
  }

  .v-input__slot {
    padding-left: 0 !important;
  }

  .v-select__slot input {
    padding-left: 10px;
  }

}


.v-autocomplete__content {
  .v-list__tile {
    height: auto;
  }

  .v-list-item__icon {
    margin: 0;
  }

  .v-list-item__icon:first-child {
    margin-right: 10px;
    font-size: 24px;
    padding: 0;
    align-items: center;
    display: flex;

    .our-icon {
      padding-top: 5px;
    }
  }


  .v-list__tile__title {
    font-weight: bold !important;

  }

  .theme--light.v-list {
    .v-list__tile__mask {
      background: #fff;
      color: #333;
      font-weight: normal;
    }
  }
}

.v-input__icon--append .v-icon {
  //display: none !important;
}


</style>