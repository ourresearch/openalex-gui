<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <div class="text-h3 mb-2">
        Unpaywall Curation
      </div>

      <div class="text-subtitle-1 mb-8 text-grey-darken-3">
        Submit curation requests to Unpaywall. Changes will show up within two days.
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-hover v-slot:default="{ props, isHovering }">
            <v-card 
              flat 
              v-ripple 
              :class="isHovering ? 'bg-blue-lighten-1' : 'bg-blue'"
              rounded="xl" 
              class="pa-4 mx-1 d-flex align-center" 
              to="/curate/works" 
              v-bind="props"
            >
              <v-icon icon="mdi-file-document-outline" color="blue-lighten-5" size="42" class="ml-3 mr-1"/>
              <div>
                <v-card-title class="d-flex align-center mb-0 py-0" style="font-size: 28px;">
                  Works
                </v-card-title>
                <v-card-subtitle style="font-size: 16px; opacity: 0.9;">Correct Open Access links and licenses</v-card-subtitle>
              </div>
            </v-card>
          </v-hover>
        </v-col>

        <v-col cols="12" md="6">
          <v-hover v-slot:default="{ props, isHovering }">
            <v-card 
              flat 
              v-ripple 
              :class="isHovering ? 'bg-blue-lighten-1' : 'bg-blue'"
              rounded="xl" 
              class="pa-4 mx-1 d-flex align-center" 
              to="/curate/sources" 
              v-bind="props"
            >
              <v-icon icon="mdi-book-open-outline" color="blue-lighten-5" size="42" class="ml-3 mr-1"/>
              <div>
                <v-card-title class="d-flex align-center mb-0 py-0" style="font-size: 28px;">
                  Sources
                </v-card-title>
                <v-card-subtitle style="font-size: 16px; opacity: 0.9;">Correct Open Access status</v-card-subtitle>
              </div>
            </v-card>
          </v-hover>
        </v-col>

      </v-row>
    </v-container>
  </div>

</template>


<script setup>

</script>

<style scoped>
</style>
