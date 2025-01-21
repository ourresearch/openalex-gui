<template>
  <v-card flat rounded class="example-query fill-height d-flex flex-column">
    <v-card-title>
      <router-link class="question-link" :to="url">{{ question }}</router-link>
    </v-card-title>
    <div v-if="error" style="margin: 0 20px 10px;">
      <b>Error:</b> {{ error }}
    </div>
    <v-spacer />
    <v-card-actions>
      <v-chip label outlined>{{type}}</v-chip>
      <v-chip label outlined>{{category}}</v-chip>  
   
      <!--
      <v-chip outlined label :color="this.color('type')">{{type}}</v-chip>
      <v-chip outlined label :color="this.color('category')">{{category}}</v-chip>   
      <v-chip  :color="this.color('type')" :style="this.bgColorStyle('type')">{{type}}</v-chip>
      <v-chip  :color="this.color('category')" :style="this.bgColorStyle('category')">{{category}}</v-chip>
      -->
          </v-card-actions>
  </v-card>
</template>


<script>

export default {
  name: "ExampleQuery",
  components: {
  },
  props: {
    question: String,
    type: String,
    category: String,
    error: String,
    url: String,
  },
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
  },
  created() {
  },
  mounted() {
  },
  watch: {}
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