<template>

  <form class="main-search">
    <v-combobox
        class="mr-12"
        flat
        outlined
        dense
        solo
        hide-details
        item-text="display_name"
        item-value="id"
        append-icon="mdi-magnify"
        id="main-search"
        style="width: 100%;"

        v-model="select"
        :items="items"
        :search-input.sync="searchString"
        :loading="isFetchingItems"
        :placeholder="selectedEntityTypeConfig.placeholder"


        @focus="onFocus"
        @keyup.enter="submitSearch"
        @input="goToEntityPage"
        @click:append="submitSearch"

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
                @click="openEntityMenu"
            >
              <v-icon left>{{ selectedEntityTypeConfig.icon }}</v-icon>
              <span>{{ selectedEntityTypeConfig.displayName }}</span>
              <v-icon right>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list
              two-line
          >
            <v-list-item
                v-for="entityType in entityTypeOptions"
                :key="entityType.name"
                @click="clickToSetSelectedEntityType(entityType.name)"
                class=""
            >
              <v-list-item-icon>
                <v-icon>{{ entityType.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="text-capitalize">
                  <span>{{ entityType.displayName }}</span>
                </v-list-item-title>
                <v-list-item-subtitle class="">
                  {{ entityType.descr }}
                </v-list-item-subtitle>

              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template v-slot:item="data">
        <!--        <v-list-item-icon>-->
        <!--          <v-icon>{{ selectedEntityTypeConfig.icon }}</v-icon>-->
        <!--        </v-list-item-icon>-->
        <v-list-item-content class="" style="">
          <v-list-item-title style="font-weight: normal; font-size: 16px;">
            {{ data.item.display_name }}
          </v-list-item-title>
          <v-list-item-subtitle style="font-weight: normal; margin-top:5px; white-space: normal;">
            {{ data.item.hint }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </template>
    </v-combobox>

  </form>


</template>

<script>
import axios from 'axios'
// import AbortController from 'axios'
import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {entityConfigs} from "../entityConfigs";

// setTimeout(function(){
//   const searchInput = document.getElementById("main-search")
//   console.log("focus!", searchInput)
//   searchInput.focus()
//
// }, 2000)

export default {
  name: "SearchBox",
  props: {
    isAloneOnPage: {
      type: Boolean,
      default: false,
    }
  },
  data: function () {
    // const controller = new AbortController()

    return {
      select: "",
      isFetchingItems: false,
      items: [],
      searchString: "",
      entityConfigs,
      selectedEntityType: "works",
      // axiosAbortController: new AbortController()
    }
  },
  computed: {
    ...mapGetters([]),
    entityTypeOptions() {
      return [...Object.values(entityConfigs)]
    },
    selectedEntityTypeConfig() {
      return entityConfigs[this.selectedEntityType]
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
      const singularName = this.selectedEntityType.slice(0, -1)
      url.searchParams.set("entity_type", singularName)
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
    clickToSetSelectedEntityType(value) {
      this.setSelectedEntityType(value)
      // i need this to set the focus on the search input after the users clicks to make
      // an entity selection.
      setTimeout(function () {
        const searchInput = document.getElementById("main-search")
        searchInput.focus()
      }, 0)
      if (this.isAloneOnPage) {
        this.fetchSuggestions()
      } else {
        this.submitSearch()
      }

    },

    setSelectedEntityType(value) {
      this.items = []
      this.selectedEntityType = value
    },
    openEntityMenu() {
      this.items = []

    },
    onFocus() {
      // the vuetify component's default behavior is to highlight the whole imput string.
      // i don't want this, i want to just place the cursor at the end of the string.
      setTimeout(function () {
        let sel = document.getSelection();
        sel.collapseToEnd();

      }, 0)
    },
    submitSearch() {
      this.items = []
      this.isFetchingItems = false
      if (this.select?.id) {
        console.log("there's a select.id", this.select)
        // take us to an entity page, if possible
        this.goToEntityPage()
      } else {

        this.doTextSearch({
          entityType: this.selectedEntityType,
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
      this.isFetchingItems = true
      axios.get(this.autocompleteUrl)
          .then(resp => {
            if (!this.searchString) {
              console.log("no search string, clearing items")
              this.items = []
            }
            else if (!this.isFetchingItems){
              // if someone set isFetchingItems to false, we need to abort
            }
            else {
              this.items = resp.data.results.slice(0, 5).map(i => {
                const pluralEntityType = i.entity_type + "s"
                i.icon = entityConfigs[pluralEntityType].icon
                return i
              })
            }
            this.isFetchingItems = false
          })
    }
  },
  watch: {
    searchString(val) {
      if (!val) this.items = []
      this.fetchSuggestions(val)
    },


    "$store.state.entityType": {
      handler(to, from) {
        this.setSelectedEntityType(to)
      },
      immediate: true,
    },

    "$store.state.textSearch": {
      handler(to, from) {
        this.select = to
      },
      immediate: true,
    },
  },
  mounted() {
    const autoFocus = this.isAloneOnPage
    setTimeout(function () {
      const searchInput = document.getElementById("main-search")
      if (autoFocus) {
        searchInput.focus()
      }
    }, 0)
  },
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

  // very fragile hack to hide the down-arrow icon on the far right
  .v-select__slot {
    .v-input__append-inner:nth-child(3) {
      //display: none !important;
      visibility: hidden;
    }
  }

  // very fragile hack to hide the down-arrow icon on the far right
  .v-select.v-select--is-menu-active .v-input__icon--append .v-icon {
    transform: none !important;
  }


}

.v-application--is-ltr .v-list-item__action:first-child, .v-application--is-ltr .v-list-item__icon:first-child {
  margin-right: 15px !important;
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