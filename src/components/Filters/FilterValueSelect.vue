<template>
  <div>
    <!--    <v-autocomplete-->
    <!--            dense-->
    <!--            :loading="isLoading"-->
    <!--            :items="options"-->
    <!--            item-text="displayValue"-->
    <!--            v-model="selectedValue"-->
    <!--            :search-input.sync="searchString"-->
    <!--            @change="$emit('submit', selectedValue)"-->
    <!--    />-->
    <!--    <v-chip-->
    <!--      v-for-->
    <!--    >-->
    <!--      -->
    <!--    </v-chip>-->
    <filter-value-chip
      v-for="value in mySelectedValues"
      :key="value"
      :filter-key="filterKey"
      :filter-value="value"
    />
    <v-menu max-height="90vh">
      <template v-slot:activator="{on}">
        <v-btn
                text
                rounded
                v-on="on"
        >
          <v-icon>mdi-plus</v-icon>
          <v-icon>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-card max-height="90vh">
        <v-text-field
                v-model="searchString"
                autofocus
                clearable
                hide-details
                class="mx-2"
                prepend-inner-icon="mdi-magnify"
        />
        <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
          <v-list>
            <v-list-item
                    v-for="option in options"
                    :key="option.value"
                    @click="addSelectedValue(option.value)"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ option.displayValue }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </div>

      </v-card>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {api} from "@/api";
import FilterValueChip from "./FilterValueChip.vue";

export default {
    name: "FilterValueSelect",
    components: {
        FilterValueChip,
    },
    props: {
        readonly: Boolean,
        filterKey: String,
        filterValue: String,
        displayValue: String,
    },
    data() {
        return {
            foo: 42,
            isLoading: false,
            selectedValue: this.filterValue,
            options: [],
            searchString: "",
            mySelectedValues: [],
            mySelectedDisplayValues: [
                this.displayValue
            ]
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
        ]),
        mySelectedValueString() {
            return this.mySelectedValues.join("|")
        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
        ]),
        ...mapActions([]),
        async addSelectedValue(filterKey) {
            this.mySelectedValues.push(filterKey)
        },
        async submit(filterKey) {
            this.$emit("submit", this.mySelectedValueString)
        },
        async fetchOptions() {
            this.isLoading = true
            try {
                this.options = await api.getGroups(
                    this.entityType,
                    this.filterKey,
                    {
                        searchString: this.searchString
                    },
                )
            } catch (e) {
                console.log("fetchFilters() error:", e.message)
            } finally {
                this.isLoading = false
            }
        }


    },
    created() {
    },
    mounted() {
      if (this.filterValue) {
          this.mySelectedValues.push(this.filterValue)
      }
    },
    watch: {
        searchString: {
            immediate: true,
            handler: async function (newVal, oldVal) {
                await this.fetchOptions()
            },
        }

    }
}
</script>

<style scoped lang="scss">

</style>