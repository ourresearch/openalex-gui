<template>
  <v-tooltip left>
    <template v-slot:activator="{ on, attrs }">
      <span
          v-bind="attrs"
          v-on="on"
      >
        Left
      </span>
    </template>
    <span>Left tooltip</span>
  </v-tooltip>
</template>

<script>

// this is currently unusued, it's a work in progress....

export default {
  name: "oTooltip",
    props: {
    text: {
      type: String,
    }
  },

  data: function () {
    return {

    }
  },

}

</script>

<style scoped>

</style>