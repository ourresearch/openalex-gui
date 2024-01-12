import '@mdi/font/css/materialdesignicons.css'

import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);
import colors from 'vuetify/lib/util/colors'

export default new Vuetify({
    theme: {
    themes: {
      light: {
        primary: colors.blue.darken2,
        secondary: colors.blueGrey.darken4,
        accent: colors.indigo.base,
      },
    },
  },
});
