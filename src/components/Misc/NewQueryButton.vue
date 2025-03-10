<template>
    <v-btn 
        v-bind="$attrs"
        class="new-query-button" 
        @click="createNewSearch"
    >
        <template v-if="!goTo">
            <v-icon v-if="icon" left :color="$attrs.color === 'primary' ? undefined : 'primary'">{{ icon }}</v-icon>
            {{ buttonText }}
        </template>
        <template v-else>
            {{ buttonText }}
            <v-icon right>mdi-chevron-right</v-icon>
        </template>
    </v-btn>   
</template>

<script>
import {mapActions} from "vuex";

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
    methods: {
        ...mapActions("search",["createNewSearch"]),
    }
}
</script>
