import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import colors from 'vuetify/util/colors'

const baseWeight = "lighten5";
const darkerWeight = "lighten4";
const darkWeight = "darken1";

export default createVuetify({
  components,
  directives,
  defaults: {
    // Global icon size default
    VIcon: {
      size: 18,
    },
    
    // List defaults
    VList: {
      density: 'compact',
      nav: true,  // Adds appropriate padding for navigation lists
    },
    
    VListItem: {
      density: 'compact',
      rounded: 'lg',  // Subtle rounding like Linear
    },
    
    VListSubheader: {
      class: 'linear-list-subheader',
    },
    
    VBtn: {
      variant: 'outlined',  // Secondary is most common, make it default
      rounded: 'md',
      elevation: 0,
      ripple: false,        // Disable Material ripple effect
    },
    
    VTextField: {
      density: 'compact',
    },
    
    VSelect: {
      density: 'compact',
    },
    
    VSnackbar: {
      color: 'white',
      class: 'snackbar-outlined',
    },
    VTooltip: {
      contentClass: 'tooltip-light',
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#000000',  // Black for primary buttons
          'on-primary': '#FFFFFF',
          'surface-variant': '#F5F5F5',
          secondary: colors.blueGrey.darken4,
          accent: colors.indigo.base,
          info: colors.blue.darken2,  // Keep blue for informational elements and links

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

          catWorksDarker: colors.blue[darkerWeight],
          catEntityDarker: colors.green[darkerWeight],
        }
      }
    }
  },
  icons: {
    defaultSet: 'mdi',
  }
})
