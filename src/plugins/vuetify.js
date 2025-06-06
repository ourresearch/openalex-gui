import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import colors from 'vuetify/util/colors'

const baseWeight = "lighten5";
const darkerWeight = "darken3";
const lighterWeight = "lighten5";

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: colors.blue.darken2,
          secondary: colors.blueGrey.darken4,
          accent: colors.indigo.base,

          catRed: colors.red[baseWeight],
          catBlue: colors.blue[baseWeight],
          catGreen: colors.green[baseWeight],
          catOrange: colors.orange[baseWeight],
          catPurple: colors.purple[baseWeight],
          catTeal: colors.teal[baseWeight],

          catRedDarker: colors.red[darkerWeight],
          catBlueDarker: colors.blue[darkerWeight],
          catGreenDarker: colors.green[darkerWeight],
          catOrangeDarker: colors.orange[darkerWeight],
          catPurpleDarker: colors.purple[darkerWeight],
          catTealDarker: colors.teal[darkerWeight],

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
        }
      }
    }
  },
  icons: {
    defaultSet: 'mdi',
  }
})
