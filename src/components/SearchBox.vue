<template>

    <form class="main-search" @submit.prevent="goSearch(searchString)">
        <v-combobox
                v-model="search.query.q"
                :items="items"
                :search-input.sync="searchString"
                @input="goSearch"
                class="mx-3"
                hide-no-data
                hide-details
                solo
        ></v-combobox>

    </form>


</template>

<script>
    import axios from 'axios'
    import {search} from '../search'

    export default {
        name: "SearchBox",
        data: () => ({
            select: search.query.q,
            loading: false,
            items: [],
            searchString: "",
            search: search
        }),
        computed: {
            displayItems(){
                return this.items.slice(0, 6)
            }
        },
        methods: {
            goSearch(q) {
                // this.items = this.items.filter(x=>{
                //     let suggestion = (x || "").toLowerCase()
                //     let myQ = (q || "").toLowerCase()
                //     return suggestion.indexOf(myQ) > -1
                // })
                if (q){
                    this.fetchSuggestions(q)
                }
                else {
                    this.items = []
                }
                search.setQ(q)
                search.query.page = 1
                this.$emit("submit", q)

            },
            fetchSuggestions(v) {
                this.loading = true

                let url = "https://gtr-api.herokuapp.com/autocomplete/" + v
                axios.get(url)
                    .then(resp => {
                        this.items = resp.data.results.slice(0, 6)
                        this.loading = false
                    })
            }
        },
        watch: {
            searchString(val) {
                val && val !== this.select && this.fetchSuggestions(val)
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

        .v-list__tile__title {
            font-weight: bold !important;

        }

        .theme--light.v-list  {
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