<template>
  <v-chip v-if="topic" outlined class="mr-1 mb-1 pr-0" @click="clickLevel('topic')">
    <div>{{ topic.display_name }}</div>
    <v-divider vertical class="ml-2" />
    <v-menu>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(level, i) in levelNames"
          :key="level"
          :class="'pl-' + (4 + i*2)"
          exact-path
          @click="clickLevel(level)"
        >
          <span >
            <v-icon>{{ i === 0 ? "mdi-lightbulb-outline" : "mdi-subdirectory-arrow-right" }} </v-icon>
          </span>
          
            <v-list-item-title :class="{'font-weight-bold': level==='topic'}">
              {{ level !== 'topic' ? topic[level].display_name : topic.display_name}}
            </v-list-item-title>
            <v-list-item-subtitle >
              {{  level !== 'topic' ?  level : "topic" }}
            </v-list-item-subtitle>
          
        </v-list-item>


      </v-list>
    </v-menu>
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {},
  props: {
    topic:Object,
  },
  data() {
    return {
      foo: 42,
      levelNames: [
          "domain",
          "field",
          "subfield",
          "topic",
      ]
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    myPluralize(str){
      return this.$pluralize(str, 2)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    clickLevel(levelName){
      console.log("clickLevel", levelName)


      const entityId = (levelName === "topic") ?
          shortenOpenAlexId(this.topic.id) :
          this.topic[levelName].id

      this.$router.push({
        name: "EntityPage",
        params: {
          entityType: this.$pluralize(levelName, 2),
          entityId,
        }
      })
    }


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
