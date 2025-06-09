<template>
  <div class="color-2 py-12">
    <v-container>
        <v-row>
          <v-col cols="0" md="1">
          </v-col>
          <v-col cols="12" md="10">
            <router-view />
          </v-col>
          <v-col cols="0" md="1">
          </v-col>
        </v-row>
    </v-container>
  </div>
</template>


<script>

export default {
  name: "MeBase",
  components: {},
  props: {},
  data() {
    return {
    }
  },
}
</script>


<style lang="scss">
.v-alert {
  font-size: 18px;
  margin: 10px;
  border-radius: 15px !important;
}
.v-alert .v-icon {
  font-size: 30px;
  margin-top: 1px;
}
</style>