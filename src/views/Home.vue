<template>
  <div class="home">
    <v-container style="min-height: 75vh;" class="d-flex align-center">
      <v-row>
        <v-col cols="2" class="hidden-xs-only"></v-col>
        <v-col>
          <v-card flat class="">
            <div class="text-h4 text-center">Look up entities:</div>
            <ul style="list-style-type: none;" class="my-6">
              <li
                  v-for="config in entityConfigs"
                  :key="config.name"
                  class="my-1"
              >
                {{ config.icon }}
                <strong class="text-capitalize">{{ config.name }}s </strong>
                <span v-html="`${config.descr}.`"></span>
              </li>
            </ul>
            <search-box @submit="goSearch" />
            <div class="d-flex justify-center">
              <v-btn large @click="goSearch" class="mr-2">Search</v-btn>
              <v-menu offset-y content-class="no-highlight" min-width="150">
                <template v-slot:activator="{on}">
                  <v-btn large v-on="on">
                    I'm feeling lucky
                    <v-icon>mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-subheader>View a random entity:</v-subheader>
                  <v-list-item
                      v-for="(config, k) in entityConfigs"
                      :to="`/${config.name}/random`"
                      :key="config.name"
                      class="text-capitalize"
                  >
                    <span class="mr-2">{{config.icon}}</span>
                    {{config.name}}
                  </v-list-item>
                </v-list>
              </v-menu>

            </div>
            <div>
            </div>
          </v-card>

        </v-col>
        <v-col cols="2" class="hidden-xs-only"></v-col>

      </v-row>

    </v-container>



  </div>


</template>

<script>

import axios from "axios";
import SearchBox from "../components/SearchBox";
import {entityConfigs} from "../entityConfigs";
import {mapGetters} from "vuex";

export default {
  name: 'home',
  components: {
    SearchBox,
  },
  metaInfo: {
    title: "OpenAlex GUI",
    titleTemplate: undefined, // have to override this or it'll get the site title template
  },
  data() {
    return {
      results: [],
      entityConfigs,


    }
  },
  computed: {
    ...mapGetters([
        "serpUrl",
    ]),
  },
  methods: {
    goSearch() {
      // this.$router.push(this.serpUrl)
    }
  },
  mounted() {
    // this.doSearch()
  },
}
</script>

<style lang="scss">

.above-the-fold {
  /*background: linear-gradient(0deg, rgba(230,230,230,1) 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%);*/
  //background: linear-gradient(0deg, #eee 20%, #fff 20%);
}


</style>
