<template>

  <form class="main-search">
    <!--    <v-combobox-->
    <!--        class="mr-12"-->
    <!--        flat-->
    <!--        outlined-->
    <!--        solo-->
    <!--        hide-details-->

    <!--        clearable-->
    <!--        append-icon="mdi-magnify"-->
    <!--        id="main-search"-->
    <!--        style="width: 100%;"-->
    <!--        :color="color"-->
    <!--        rounded-->

    <!--        v-model="select"-->
    <!--        :items="items"-->
    <!--        :search-input.sync="searchString"-->
    <!--        :loading="isFetchingItems"-->
    <!--        :placeholder="selectedEntityTypeConfig.placeholder"-->


    <!--        @focus="onFocus"-->
    <!--        @keydown.enter="doSearch('keyup.enter')"-->
    <!--        @input="doSearch('input')"-->
    <!--        @click:append="doSearch"-->
    <!--        @click:clear="searchString = ''"-->

    <!--    >-->
    <v-combobox
        class="mr-12"
        solo
        hide-details

        clearable
        append-icon="mdi-magnify"
        id="main-search"
        style="width: 100%;"
        :color="color"
        rounded

        v-model="select"
        :items="[]"


        @keydown.enter="doSearch('keyup.enter')"
        @click:append="doSearch('click:append')"
        @click:clear="searchString = ''"

    >
      <template v-if="true" v-slot:prepend-inner>
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
                rounded
                text
                large
                :x-large="isAloneOnPage"
                class="text-capitalize pl-4"
                style="margin-left: -24px;"
                v-bind="attrs"
                v-on="on"
                @click="openEntityMenu"
                id="entity-type-select-btn"
            >
              <v-icon>{{ selectedEntityTypeConfig.icon }}</v-icon>
              <span class="d-none">{{ selectedEntityTypeConfig.displayName }}</span>
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list
              two-line
          >
            <v-subheader>Search for:</v-subheader>
            <v-divider></v-divider>
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
        <v-list-item-icon>
          <v-icon>mdi-magnify</v-icon>
        </v-list-item-icon>
        <v-list-item-title style="font-size: 16px;">
          {{ data.item }}
          <!--          {{data.item.displayName}}-->
        </v-list-item-title>
      </template>

    </v-combobox>
  </form>


</template>

<script>
import axios from 'axios'
// import AbortController from 'axios'
import {url} from "../url";
import {createSimpleFilterFromPid} from "../filterConfigs";
import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {entityConfigs} from "../entityConfigs";
import EntityIcon from "./EntityIcon";
import _ from 'lodash'
import {idConfigs} from "../idConfigs";


// setTimeout(function(){
//   const searchInput = document.getElementById("main-search")
//   console.log("focus!", searchInput)
//   searchInput.focus()
//
// }, 2000)

const pushSafe = async function (router, pushTo) {
  await router.push(pushTo)
      .catch((e) => {
        if (e.name !== "NavigationDuplicated") {
          throw e
        }
      })
}


export default {
  name: "SearchBox",
  props: {
    isAloneOnPage: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "primary",
    },
    prominent: Boolean,
  },
  components: {
    EntityIcon,
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
      const url = new URL("https://api.openalex.org")
      url.pathname = (this.selectedEntityType === "works") ?
          "suggest" :
          `autocomplete/${this.selectedEntityType}`

      url.searchParams.set("email", "team@ourresearch.org")
      url.searchParams.set("q", this.searchString)
      return url.toString()
    }
  },
  methods: {
    ...mapMutations([
      "setEntityType",
    ]),
    ...mapActions([
      "replaceInputFilters",
      "removeAllInputFilters",
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
        this.doSearch()
        this.removeAllInputFilters()
      }

    },

    setSelectedEntityType(value) {
      this.items = []
      this.select = undefined
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

    doSearch: _.debounce(async function (context) {
      this.items = []
      const idFilter = createSimpleFilterFromPid(this.select)

      if (idFilter){

      }

      console.log("SearchBox idFilter", idFilter)
      const searchTerm = (idFilter) ? "" : this.select
      const entityType = (idFilter) ? idFilter.entityType : this.selectedEntityType

        await url.pushNewSearch(this.$router, entityType, searchTerm)


      if (idFilter) {
        await this.replaceInputFilters([idFilter])
      }
      else {
        await url.pushNewSearch(this.$router, entityType, searchTerm)
      }

    }, 10, {leading: false}),
    fetchSuggestions(v) {
      if (!this.searchString) {
        this.items = []
        return
      }
      // this.isFetchingItems = true
      axios.get(this.autocompleteUrl)
          .then(resp => {
            if (!this.searchString) {
              console.log("no search string, clearing items")
              this.items = []
            } else {
              let items = resp.data.results.map(r => {
                return (this.selectedEntityType === 'works') ? r.phrase : r.display_name
              })
              const uniqueItems = [...new Set(items)]
              this.items = uniqueItems.slice(0, 5)
            }
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

  #entity-type-select-btn {
    min-width: 0px;
    padding-left: 10px;
    padding-right: 0;
    margin-left: -10px;

    &.v-size--x-large {
    }
  }

  //.v-btn:not(.v-btn--round).v-size--large {
  //  height: 49px;
  //}
  //
  //.v-input__slot {
  //  padding-left: 0 !important;
  //}
  //
  //.v-select__slot input {
  //  padding-left: 10px;
  //}

  // very fragile hack to hide the down-arrow icon on the far right
  .v-select__slot {
    .v-input__append-inner:nth-child(3) {
      //display: none !important;
      //visibility: hidden;
    }
  }

  // very fragile hack to hide the down-arrow icon on the far right
  .v-select__slot {
    .v-input__append-inner:nth-child(2) {
      //display: none !important;
      //margin-right: -25px;
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