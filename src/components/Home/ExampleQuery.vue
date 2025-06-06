<template>
  <v-card rounded="xl" flat class="example-query fill-height d-flex flex-column py-3 px-4">
    <div class="text-body-1 text-weight-bold mb-4 question-link" @click="handleQueryClick(query)">
      {{ question }}
    </div>
    <div v-if="error" style="margin: 0 20px 10px;">``
      <b>Error:</b> {{ error }}
    </div>
    <v-spacer />
    <div>
      <v-chip label :color="chipColor(type)">{{type}}</v-chip>
      <v-chip label :color="chipColor(category)">{{category}}</v-chip>  
    </div>
  </v-card>
</template>


<script>

import {mapActions, mapGetters} from "vuex";

export default {
  name: "ExampleQuery",
  components: {
  },
  props: {
    question: String,
    type: String,
    category: String,
    error: String,
    query: Object,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
  },
  methods: {
    ...mapActions("search", [
      "createSearchFromQuery"
    ]),
    chipColor(category) {
      const colors = {
        "works": "catBlueDarker",
        "authors": "catGreenDarker",
        "sources": "catTealDarker",
        "institutions": "catPurpleDarker",
        "topics": "catTealDarker",
        "sdgs": "catRedDarker",
        "funders": "catBlueDarker",
        "keywords": "catGreenDarker",
        "fields": "catOrangeDarker",
        "countries": "catPurpleDarker",

        "discovery": "catTealDarker",
        "metrics": "catRedDarker",
        "compliance": "catBlueDarker",
        "trend detection": "catTealDarker",
        "expert discovery": "catPurpleDarker",
        "open access": "catGreenDarker",
        "recommenders": "catTealDarker",
        "rankings": "catRedDarker",
        "collaboration": "catBlueDarker",
      };
      return category in colors ? colors[category] :"primary";
    },
    handleQueryClick(query) {
      if (!this.userId) {
        this.$router.push({
          name: 'Login',
          query: { redirect: '/analytics' }
        });
        return;
      }
      
      this.createSearchFromQuery(query);
    },
  },
}
</script>


<style lang="scss" scoped>

.v-card__title {
  padding-bottom: 10px;
}
.question-link {
  text-decoration: none;
  word-break: normal;
  line-height: 1.6rem;
  font-size: 16px;
  cursor: pointer;
}
.v-card__actions {
  padding: 0px 15px 15px 15px;
  /*background-color: $color-3;*/
}
.v-chip {
  margin-right: 6px;
} 
.v-chip.v-chip--outlined.v-chip.v-chip {
  background-color: white !important;
}
</style>