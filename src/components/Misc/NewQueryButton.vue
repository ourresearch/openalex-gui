<template>
    <v-btn 
        v-bind="$attrs"
        class="new-query-button" 
        @click="onClick"
    >
        <template v-if="!goTo">
            <v-icon v-if="icon" v-bind="sizeAttrs" :color="$attrs.color === 'primary' ? undefined : 'primary'">{{ icon }}</v-icon>
            {{ buttonText }}
        </template>
        <template v-else>
            {{ buttonText }}
            <v-icon right v-bind="sizeAttrs">mdi-chevron-right</v-icon>
        </template>
    </v-btn>   
</template>

<script>
import {mapActions, mapGetters} from "vuex";

export default {
    name: "NewQueryButton",
    inheritAttrs: false,
    props: {
        buttonText: {
            type: String,
            default: "New Query"
        },
        icon: {
            type: String,
            default: "mdi-plus"
        },
        goTo: {
            type: Boolean,
            default: false
        },
    },
    computed: {
        ...mapGetters("search",["isBaseQuery"]),
        sizeAttrs() {
            // Extract size-related attributes from $attrs
            const { small, xSmall, large, xLarge } = this.$attrs;
            return { small, xSmall, large, xLarge };
        }
    },
    methods: {
        ...mapActions("search",["createNewSearch"]),
        onClick() {
            if (this.$route.name === "Results" && this.isBaseQuery) {
                return;
            }   
            this.createNewSearch();
        }
    }
}
</script>
