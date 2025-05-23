<template>
  <v-btn 
    v-bind="$attrs"
    class="new-query-button" 
    @click="onClick"
  >
    <template v-if="!goTo">
      <v-icon v-if="icon" v-bind="{[size]: true}" :color="$attrs.color === 'primary' ? undefined : 'primary'">{{ icon }}</v-icon>
      {{ buttonText }}
    </template>
    <template v-else>
      {{ buttonText }}
      <v-icon right v-bind="{[size]: true}">mdi-chevron-right</v-icon>
    </template>
  </v-btn>   
</template>


<script>
import {mapActions, mapGetters} from "vuex";

export default {
  name: "NewQueryButton",
  inheritAttrs: false,
  props: {
    buttonText: {
      type: String,
      default: "New Query"
    },
    icon: {
      type: String,
      default: "mdi-plus"
    },
    goTo: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: "small"
    }
  },
  computed: {
    ...mapGetters("search",["isBaseQuery"]),
    ...mapGetters("user", [
      "userId",
    ]),
  },
  methods: {
    ...mapActions("search",["createNewSearch"]),
    onClick() {
      if (this.$route.name === "Results" && this.isBaseQuery) {
        return;
      }
      
      if (!this.userId) {
        this.$router.push({
          name: 'Login',
          query: { redirect: '/analytics' }
        });
        return;
      }
      
      this.createNewSearch();
    }
  }
}
</script>
