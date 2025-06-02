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
          <v-list-item-icon >
            <v-icon>{{ i === 0 ? "mdi-lightbulb-outline" : "mdi-subdirectory-arrow-right" }} </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title :class="{'font-weight-bold': level==='topic'}">
              {{ level !== 'topic' ? topic[level].display_name : topic.display_name}}
            </v-list-item-title>
            <v-list-item-subtitle >
              {{  level !== 'topic' ?  level : "topic" }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

      </v-list>
    </v-menu>
  </v-chip>
</template>

<script>

import filters from "@/filters";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "WorkTopic",
  components: {},
  props: {
    topic:Object,
  },
  data() {
    return {
      levelNames: [
          "domain",
          "field",
          "subfield",
          "topic",
      ],
    }
  },
  computed: {
  },
  methods: {
    clickLevel(levelName){

      const entityId = (levelName === "topic") ?
          shortenOpenAlexId(this.topic.id) :
          this.topic[levelName].id

      this.$router.push({
        name: "EntityPage",
        params: {
          entityType: filters.pluralize(levelName, 2),
          entityId,
        }
      })
    }
  },
}
</script>


<style scoped lang="scss">

</style>