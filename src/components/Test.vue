<template>
  <div id="app">
    <div class="color-selection">
      Dragging Enabled:
      <input type="checkbox" v-model="dragging">
    </div>
    <query-builder :config="config" v-model="query"></query-builder>
  </div>
</template>

<script>
import QueryBuilder from "query-builder-vue";

import Input from "./components/Input.vue";
import Number from "./components/Number.vue";

export default {
  components: {
    QueryBuilder
  },
  data() {
    return {
      dragging: true,
      query: {
        operatorIdentifier: "OR",
        children: [
          {
            operatorIdentifier: "AND",
            children: [
              {
                identifier: "txt",
                value: "A"
              },
              {
                identifier: "txt",
                value: "B"
              },
              {
                identifier: "txt",
                value: "C"
              },
              {
                operatorIdentifier: "AND",
                children: [
                  {
                    identifier: "txt",
                    value: "c"
                  },
                  {
                    identifier: "txt",
                    value: "d"
                  }
                ]
              }
            ]
          },
          {
            operatorIdentifier: "AND",
            children: [
              {
                identifier: "txt",
                value: "a"
              },
              {
                identifier: "txt",
                value: "b"
              },
              {
                operatorIdentifier: "AND",
                children: [
                  {
                    operatorIdentifier: "AND",
                    children: [
                      {
                        identifier: "txt",
                        value: "X"
                      },
                      {
                        identifier: "txt",
                        value: "Y"
                      },
                      {
                        identifier: "txt",
                        value: "Z"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  },

  computed: {
    config() {
      return {
        operators: [
          {
            name: "AND",
            identifier: "AND"
          },
          {
            name: "OR",
            identifier: "OR"
          }
        ],
        rules: [
          {
            identifier: "txt",
            name: "Text Selection",
            component: Input,
            initialValue: ""
          },
          {
            identifier: "num",
            name: "Number Selection",
            component: Number,
            initialValue: 10
          }
        ],
        colors: [
          "hsl(88, 50%, 55%)",
          "hsl(187, 100%, 45%)",
          "hsl(15, 100%, 55%)"
        ],
        dragging: {
          animation: 300,
          disabled: !this.dragging,
          dragClass: "sortable-drag"
        }
      };
    }
  }
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji,
    Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  font-size: 16px;
}

#app {
  margin: 30px auto;
  width: 90%;
  border: 1px solid hsl(0, 0%, 75%);
}

.color-selection {
  padding: 16px;
  margin-bottom: 8px;
}

.color-selection-input {
  margin-left: 4px;
}

.sortable-drag {
  transform: skewY(-2.5deg);
  opacity: 0.6;
}
</style>
