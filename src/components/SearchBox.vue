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
              <!--              <span class="mr-2">{{ selectedEntityType.icon }}</span>-->
              <span>{{ selectedEntityType.name }}</span>
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
                v-for="entityType in entityTypeOptions"
                :key="entityType.name"
                @click="setSelectedEntityType(entityType)"
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
import {addFilter} from "../urls";

const entityTypeOptions = [
  {
    icon: "🌈",
    name: "all"
  },
  ...Object.values(entityConfigs)
]


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
  },
  data: function () {
    const myEntityType = this.entityType ?? "all"
    const cleanEntityType = (myEntityType.slice(-1) === "s") ?
        myEntityType.slice(0, -1) :
        myEntityType


    return {
      select: this.value,
      loading: false,
      items: [],
      searchString: "",
      entityConfigs,
      entityTypeOptions,
      selectedEntityType: entityTypeOptions.find(e => {
        return e.name === cleanEntityType
      })
    }
  },
  computed: {
    ...mapGetters([]),
    displayItems() {
      return this.items.slice(0, 6)
    },
    entityTypeName() {
      return this.selectedEntityType.name.replace("all", "work") + "s"
    }
  },
  methods: {
    ...mapMutations([
      "setEntityType"
    ]),
    ...mapActions([
      "updateTextSearch",
    ]),
    setSelectedEntityType(value) {
      this.selectedEntityType = value
      this.setEntityType(this.entityTypeName)
      this.fetchSuggestions(this.searchString)
    },
    submitSearch() {
      console.log("submitSearch")
      if (this.select?.id) {
        console.log("there's a select.id", this.select)
        // take us to an entity page, if possible
        this.goToEntityPage()
      } else {
        // if that didn't work, do a search
        // this.updateTextSearch(this.searchString)

        const cleanSearchString = this.searchString.replace(":", " ").replace(",", " ")

        const routerPushTo = {
          query: {
            filters: "display_name:" + cleanSearchString,
          },
          name: "Serp",
          params: {entityType: this.entityTypeName},
        };

        if (this.$route.name === "Serp") {
          routerPushTo.query = {
            ...this.$route.query,
            filters: addFilter("display_name", cleanSearchString, this.$route.query?.filters),
          }
          console.log("current serp path:", this.$route.query, routerPushTo.query)
        }

        this.$router.push(routerPushTo)
            .catch((e) => {
              if (e.name !== "NavigationDuplicated") {
                throw e
              }
            })
      }
    },

    goToEntityPage() {
      if (this.select?.id) {
        const shortId = this.select.id.replace("https://openalex.org/", "")
        this.$router.push(`/${this.select.entity_type}s/${shortId}`)

      }
    },
    fetchSuggestions(v) {
      if (!v) {
        this.items = []
        return
      }
      this.loading = true
      const url = new URL("https://api.openalex.org/autocomplete");
      url.searchParams.set("email", "team@ourresearch.org")
      url.searchParams.set("q", v)
      if (this.selectedEntityType.name !== "all") {
        url.searchParams.set("entity_type", this.selectedEntityType.name)
      }
      axios.get(url.toString())
          .then(resp => {
            if (!this.searchString) {
              console.log("no search string, clearing items")
              this.items = []
            } else this.items = resp.data.results.slice(0, 5).map(i => {
              i.icon = entityConfigs[i.entity_type].icon
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
    "selectedEntityType.name": function () {
    }
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
  display: none !important;
}


</style>