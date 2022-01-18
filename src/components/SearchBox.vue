<template>

  <form class="main-search">
    <!--    <div>select: {{ select }}</div>-->
    <!--    <div>searchstring: {{ searchString }}</div>-->
    <!--    <div>items: {{items.map(x => x.display_name)}}</div>-->

    <v-combobox
        v-model="select"
        :items="items"
        :search-input.sync="searchString"
        class="mx-3 mb-8"
        solo
        item-text="display_name"
        item-value="id"
        :loading="loading"
        @input="makeSelection"
        autofocus
    >
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

import {search} from '../search'
import {entityConfigs} from "../entityConfigs";

export default {
  name: "SearchBox",
  data: () => ({
    select: "",
    loading: false,
    items: [],
    searchString: "",
    search: search
  }),
  computed: {
    ...mapGetters([]),
    displayItems() {
      return this.items.slice(0, 6)
    }
  },
  methods: {
    ...mapMutations([
    ]),
    ...mapActions([
      "updateTextSearch",
    ]),
    makeSelection() {
      if (!this.select?.id) {
        // text search
        this.updateTextSearch(this.searchString)
        this.$emit("submit", this.searchString)
      } else {
        // entity lookup
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
      const url = `https://api.openalex.org/autocomplete?q=${v}&mailto=team@ourresearch.org`
      axios.get(url)
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
      console.log("searchString changed", `"${val}"`)
      if (!val) this.items = []
      this.fetchSuggestions(val)
    },
    select(val) {
    }
  }
}
</script>

<style lang="scss">
form.main-search {
  width: 100%;
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