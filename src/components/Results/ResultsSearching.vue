<template >
  <v-container fluid>
  <v-row class="box">
    <v-progress-circular indeterminate />
    <span class="msg">Searching...</span>
  </v-row>
  </v-container>
</template>

<script>


export default {
  name: "ResultsSearching",
}
</script>


<style scoped lang="scss">
* {
  color: #666;
}
.box {
  margin-top: 100px;
  min-height: 200px;
  justify-content: center;
}
.msg {
  margin-left: 14px;
  margin-top: 4px;
  font-style: italic;
}
</style>