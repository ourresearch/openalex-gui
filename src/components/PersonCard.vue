<template>
    <v-card width="215" class="mr-6 mb-6">
      <v-img :src="person.img" :alt="person.name" max-height="210px"/>
      <v-card-title>
        {{ person.name }}
      </v-card-title>
      <v-card-subtitle v-if="section == 'staff'">
        {{ person.title }}
      </v-card-subtitle>
      <v-spacer/>
      <v-card-actions class="justify-end">
        <v-dialog v-model="dialogIsOpen" width="500">
          <template v-slot:activator="{on, attrs}">
            <v-btn
                text
                v-bind="attrs"
                v-on="on"
            >
              more
            </v-btn>
          </template>
          <v-card class="">
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn icon @click="dialogIsOpen=false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-actions>
  
            <div class="d-flex flex-column align-center" style="margin-top: -20px;">
              <v-avatar height="200" width="200">
                <v-img :src="person.img" alt=""/>
              </v-avatar>
  
              <v-card-title class="text-h5 pb-0">
                {{ person.name }}
              </v-card-title>
  
              <div class="ma-0 pa-0">
                <span class="font-weight-bold">
                  {{ person.title }}
                </span>
  
                <span class="">
                  ({{ person.fte }})
                </span>
              </div>
            </div>
  
            <div v-if="person.links" class="d-flex justify-center">
                  <span v-for="(link, i) in person.links">
                    <a :href="link.href">{{ link.anchor }}</a>
                    <span
                        class="grey--text mx-1"
                        v-if="i < person.links.length - 1"
                    >|</span>
                  </span>
            </div>
  
            <div v-html="person.bio" class="px-5 py-5"></div>
  
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="dialogIsOpen=false">Close</v-btn>
            </v-card-actions>
          </v-card>
  
        </v-dialog>
      </v-card-actions>
    </v-card>
  </template>
  <script>
  
  export default {
    name: "PersonCard",
    props: {
      person: Object,
      section: String,
    },
    data: () => ({
      dialogIsOpen: false,
    }),
  }
  </script>
  
  
  <style lang="scss">
  .more-button {
    flex-direction: row-reverse;
  }
  </style>