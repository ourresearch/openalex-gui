<template>
  <v-card flat rounded class="example-query fill-height d-flex flex-column">
    <v-card-title>
      <a class="question-link" :href="url">{{ question }}</a>
    </v-card-title>
    <v-spacer />
    <v-card-actions>
      <v-chip label outlined>{{type}}</v-chip>
      <v-chip label outlined>{{category}}</v-chip>  
   
      <!--
      <v-chip outlined label :color="this.color('type')">{{type}}</v-chip>
      <v-chip outlined label :color="this.color('category')">{{category}}</v-chip>   
      <v-chip  :color="this.color('type')" :style="this.bgColorStyle('type')">{{type}}</v-chip>
      <v-chip  :color="this.color('category')" :style="this.bgColorStyle('category')">{{category}}</v-chip>
      -->
          </v-card-actions>
  </v-card>
</template>


<script>

const colorMap1 = {
  "topics": "#42d748", // Adjusted Muted Teal
  "institutions": "#4259d7", // Adjusted Lightened Indigo
  "sources": "#d76642", // Adjusted Soft Burnt Orange
  "authors": "#7842d7", // Adjusted Soft Purple
  "fields": "#d7b342", // Adjusted Warm Goldenrod
  "countries": "#42c6d7", // Adjusted Muted Aqua
  "works": "#d79b42", // Adjusted Soft Amber
  "sdgs": "#d76742", // Adjusted Earthy Brown
  "trend detection": "#d74274", // Adjusted Raspberry Pink
  "open access": "#c142d7", // Adjusted Deep Purple
  "discovery": "#4294d7", // Adjusted Muted Sky Blue
  "expert discovery": "#d78d42", // Adjusted Soft Burnt Amber
  "compliance": "#87d742", // Adjusted Forest Green
  "recommenders": "#42d7c7", // Adjusted Muted Turquoise
  "collaboration": "#d74275", // Adjusted Cranberry Pink
};

const colorMap = {
  "topics":   "#f94144",
  "institutions":   "#f3722c",
  "sources":   "#f8961e",
  "authors":   "#f9844a",
  "fields":    "#4d908e",
  "countries":   "#90be6d",
  "works":   "#43aa8b",
  "sdgs":   "#4d908e",
  "trend detection":   "#577590",
  "open access":   "#277da1",
  "discovery": "#577590",
  "expert discovery": "#f3722c",
  "compliance": "#f8961e",
  "recommenders": "#f9844a",
  "collaboration": "#f8961e",
};

export default {
  name: "ExampleQuery",
  components: {
  },
  props: {
    question: String,
    type: String,
    category: String,
    url: String,
  },
  data() {
    return {
      colorMap: colorMap,
    }
  },
  computed: {
  },
  methods: {
    color(option) {
      return this.colorMap[this[option]]
    },
    bgColor(option) {
      return this.color(option)
    },
    bgColorStyle(option) {
      console.log(`background-color: ${this.bgColor(option)} !important;`)
      return `background-color: ${this.bgColor(option)} !important;`
    },
    stringToColor(str) {
      // Create a hash from the string
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      // Generate a color from the hash
      const color = `#${((hash >> 24) & 0xFF).toString(16).padStart(2, '0')}${
        ((hash >> 16) & 0xFF).toString(16).padStart(2, '0')
      }${((hash >> 8) & 0xFF).toString(16).padStart(2, '0')}`;

      // Adjust brightness and saturation (lowered for a more muted palette)
      return this.adjustColor(color, -0.5, -0.9); // Adjust as needed
    },
    adjustColor(hex, brightness = 0, saturation = 0) {
      let [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
      r = Math.min(255, Math.max(0, r + brightness * 255));
      g = Math.min(255, Math.max(0, g + brightness * 255));
      b = Math.min(255, Math.max(0, b + brightness * 255));
      return `rgb(${r}, ${g}, ${b})`;
    }
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>


<style lang="scss" scoped>
$color-3: hsl(210, 50%, 92%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.v-card__title {
  padding-bottom: 10px;
}
.question-link {
  text-decoration: none;
  word-break: normal;
  line-height: 1.6rem;
}
.v-card__actions {
  padding: 0px 15px 15px 15px;
  /*background-color: $color-3;*/
}
.v-chip {
  margin-right: 6px;
  filter: brightness(1) saturate(0.6);
} 
.v-chip.v-chip--outlined.v-chip.v-chip {
  background-color: white !important;
}
</style>