<template>
  <v-list nav rounded>
    <v-list-item
        key="asdfasdfasdf"
        to="/works"
        color="primary"
    >
      <v-list-item-icon>
        <v-icon>mdi-earth</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Explore
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-group
        to="/works"
        v-for="navItem in navConfigs"
        :key="navItem.name"
        :prepend-icon="navItem.icon"
    >
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>
            {{ navItem.name }}
          </v-list-item-title>
        </v-list-item-content>


      </template>


      <template
          v-for="link in navItem.links"
      >
        <v-list-item
            :key="link.name"
            v-if="link.to"
            :to="link.to"
            color="primary"
        >
          <v-list-item-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ link.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
            :key="link.name"
            v-if="link.href"
            :href="link.href"
            target="_blank"
            color="primary"
        >
          <v-list-item-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ link.name }}
              <v-icon x-small class="right">mdi-open-in-new</v-icon>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

      </template>
    </v-list-group>

    <v-list-item
        key="upgrade"
        to="/pricing"
        color="primary"
    >
      <v-list-item-icon>
        <v-icon>mdi-diamond-stone</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Upgrade
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>


  </v-list>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {navConfigs} from "@/navConfigs";

export default {
  name: "SiteNav",
  components: {},
  props: {
    isOpen: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    navConfigs() {
      return navConfigs.map(c => {
        return {
          ...c,
          links: c.links.filter(link => {
            return link.name !== "Upgrade"
          })
        }
      })
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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