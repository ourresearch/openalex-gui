import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import colors from 'vuetify/util/colors'

const baseWeight = "lighten5";
const darkerWeight = "lighten4";
const lighterWeight = "lighten5";
const darkWeight = "darken1";

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

          catRedDark: colors.red[darkWeight],
          catBlueDark: colors.blue[darkWeight],
          catGreenDark: colors.green[darkWeight],
          catOrangeDark: colors.orange[darkWeight],
          catPurpleDark: colors.purple[darkWeight],
          catTealDark: colors.teal[darkWeight],

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
