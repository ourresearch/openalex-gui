<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <div class="text-h3 mb-4">
        Unpaywall Curation
      </div>

      <div class="text-subtitle-1 mb-6 text-grey-darken-3">
        Submit curation requests to Unpaywall. Changes will show up within two days.
      </div>

      <v-card flat rounded="xl" class="px-6 py-10">   
        <v-row>
          <v-col cols="12" md="6">
            <v-hover v-slot:default="{ props, isHovering }">
              <v-card 
                flat 
                v-ripple 
                :class="isHovering ? 'bg-blue-lighten-5' : 'bg-grey-lighten-3'"
                rounded="xl" 
                class="pa-4 mx-1" 
                to="/curate/works" 
                v-bind="props"
              >
                <v-card-title class="d-flex align-center">
                  <v-icon icon="mdi-file-document-outline" color="grey" size="28" class="mr-1" />
                  Works
                </v-card-title>
                <v-card-subtitle>Correct Open Access links and licenses</v-card-subtitle>
              </v-card>
            </v-hover>
          </v-col>

          <v-col cols="12" md="6">
            <v-hover v-slot:default="{ props, isHovering }">
              <v-card 
                flat 
                v-ripple 
                :class="isHovering ? 'bg-blue-lighten-5' : 'bg-grey-lighten-3'"
                rounded="xl" 
                class="pa-4 mx-1" 
                to="/curate/journals?v2" 
                v-bind="props"
              >
                <v-card-title class="d-flex align-center">
                  <v-icon icon="mdi-book-open-outline" color="grey" size="28" class="mr-1" />
                  Journals
                </v-card-title>
                <v-card-subtitle>Correct Open Access status</v-card-subtitle>
              </v-card>
            </v-hover>
          </v-col>

        </v-row>
      </v-card>
    </v-container>
  </div>

</template>


<script setup>

</script>

<style scoped>
</style>
