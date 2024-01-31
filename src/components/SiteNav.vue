<template>
  <div class="color-3" style="height: 100%; width: 100%;">
    <div class="py-3 d-flex flex-column align-center fill-height" >
      <router-link
          :to="{name: 'Home'}"
          class="logo-link-solo"
      >
        <img
            src="@/assets/openalex-logo-icon-black-and-white.png"
            class="logo-icon"
        />
      </router-link>
      <v-spacer/>

      <v-card flat :to="{name: 'Serp', params: {entityType}}" class="text-center mb-4" color="transparent">
        <v-chip :color="$route.name === 'Serp' ? 'primary' : 'transparent' ">
          <v-icon class="">mdi-magnify</v-icon>
        </v-chip>
        <div class="text-caption">Search</div>
      </v-card>


<!--      USER LOGGED IN-->
      <template v-if="userId">
        <v-card flat to="/" class="text-center mb-4" color="transparent">
          <v-chip :color="$route.name === 'Home' ? 'primary' : 'transparent' " >
            <v-icon class="">mdi-folder-outline</v-icon>
          </v-chip>
          <div class="text-caption">Saved</div>
        </v-card>

        <v-card flat to="/me" class="text-center mb-4" color="transparent">
          <v-chip :color="$route.name === 'Me' ? 'primary' : 'transparent' " >
            <v-icon class="">mdi-account-outline</v-icon>
          </v-chip>
          <div class="text-caption">Account</div>
        </v-card>
      </template>


<!--      NO USER LOGGED IN-->
      <template v-else>
        <v-card flat to="/signup" class="text-center mb-4" color="transparent">
          <v-chip :color="$route.name === 'Signup' ? 'primary' : 'transparent' " >
            <v-icon class="">mdi-account-plus-outline</v-icon>
          </v-chip>
          <div class="text-caption">Sign up</div>
        </v-card>
        <v-card flat to="/login" class="text-center mb-4" color="transparent">
          <v-chip :color="$route.name === 'Login' ? 'primary' : 'transparent' " >
            <v-icon class="">mdi-login</v-icon>
          </v-chip>
          <div class="text-caption">Log in</div>
        </v-card>

      </template>

      <v-card flat href="https://help.openalex.org" target="_blank" class="text-center" color="transparent">
        <v-chip color="transparent">
          <v-icon class="">mdi-help-circle-outline</v-icon>
        </v-chip>
        <div class="text-caption">Help</div>
      </v-card>
    </div>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {navConfigs} from "@/navConfigs";
import {user} from "@/store/user.store";

export default {
  name: "SiteNav",
  components: {},
  props: {
    isOpen: Boolean,
    isMini: Boolean,
    bottom: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    user() {
      return user
    },
    ...mapGetters([
      "resultsFilters",
        "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
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