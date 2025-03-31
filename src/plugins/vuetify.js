import '@mdi/font/css/materialdesignicons.css'

import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);
import colors from 'vuetify/lib/util/colors'

const baseWeight = "lighten5";
const darkerWeight = "lighten4";
const lighterWeight = "lighten5";

export default new Vuetify({
  theme: {
    options: { customProperties: true },
    themes: {
      light: {
        primary: colors.blue.darken2,
        secondary: colors.blueGrey.darken4,
        accent: colors.indigo.base,

        catRed: colors.red[baseWeight],
        catBlue: colors.blue[baseWeight],
        catGreen: colors.green[baseWeight],
        catOrange: colors.orange[baseWeight],
        catPurple: colors.purple[baseWeight],
        catTeal: colors.teal[baseWeight],

        catWorks: colors.blue[baseWeight],
        catEntity: colors.green[baseWeight],
        catDisplay: colors.purple[baseWeight],
        catMetrics: colors.red[baseWeight],
        catSort: colors.teal[baseWeight],

        catWorksDarker: colors.blue[darkerWeight],
        catEntityDarker: colors.green[darkerWeight],
        catDisplayDarker: colors.teal[darkerWeight],
        catMetricsDarker: colors.red[darkerWeight],
        catSortDarker: colors.purple[darkerWeight],

        catWorksLighter: colors.blue[lighterWeight],
        catEntityLighter: colors.green[lighterWeight],
      },
    },
  },
  options: {
    customProperties: true
  }
});
