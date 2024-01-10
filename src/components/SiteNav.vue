<template>
  <div class="pt-7">
    <div class="d-flex flex-column align-end " v-if="isMini">
      <router-link
          :to="{name: 'Home'}"
          class="logo-link-solo"
      >
        <img
            src="@/assets/openalex-logo-icon-black-and-white.png"
            class="logo-icon"
        />
      </router-link>
    </div>
    <div class="d-flex flex-column align-start pl-4 " v-else>
      <router-link
          :to="{name: 'Home'}"
          class="logo-link"
      >
        <img
            src="@/assets/openalex-logo-icon-black-and-white.png"
            class="logo-icon mr-0 colorizable"
        />
        <span
            class="logo-text colorizable"
        >
                OpenAlex
              </span>

      </router-link>

    </div>

    <v-list v-if="0" nav rounded>

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
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {navConfigs} from "@/navConfigs";

export default {
  name: "SiteNav",
  components: {},
  props: {
    isOpen: Boolean,
    isMini: Boolean,
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
            return link.name !== "Upgrade" && link.name !== "Privacy policy"
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
$logo-link-height: 40px;

.logo-link-solo {
  .logo-icon {
    height: 45px;
    //margin-top: -5px;
  }
}

.logo-link {
  text-decoration: none;
  width: 151px;
  display: flex;
  align-items: center;
  //padding-left: 30px;
  .logo-icon {
    height: $logo-link-height;
    //margin-top: -5px;
  }

  .logo-text {
    //padding: 0 14px;

    padding-left: .3em;
    line-height: 1.2;
    //border-left: 1px solid #333;
    color: #000;


    font-family: Dosis;
    font-size: $logo-link-height * 0.75;
    font-weight: 500;
  }
}
</style>