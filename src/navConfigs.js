const navConfigs = [
    {
        name: "Learn",
        icon: "mdi-book-open-outline",
        links: [
            {
                name: "About the data",
                href: "https://help.openalex.org/",
            },
            {
                name: "API docs",
                href: "https://docs.openalex.org/",
            },
            {
                name: "Source Code",
                href: "https://github.com/ourresearch",
            },
            {
                name: "Terms of Service",
                href: "OpenAlex_termsofservice.pdf",
            },
            {
                name: "Privacy",
                href: "OpenAlex_privacy_policy.pdf",
            },
        ],

    },
    {
        name: "Evaluate",
        icon: "mdi-information-outline",
        links: [
            {
                name: "Testimonials",
                to: "/testimonials",
            },
            {
                name: "Coverage",
                href: "https://help.openalex.org/coverage",
            },
            {
                name: "Data Stats",
                to: "/stats",
            },
            {
                name: "Pricing",
                href: "https://help.openalex.org/pricing",
            },
            {
                name: "Press",
                href: "https://help.openalex.org/hc/en-us/articles/29039538348823-OpenAlex-in-the-News",
            },
            {
                name: "Citations",
                to: "/works-citing-openalex",
            },
        ],

    },

    {
        name: "Connect",
        icon: "mdi-chat-outline",
        links: [
            {
                name: "Contact",
                href: "https://openalex.zendesk.com/hc/requests/new",
            },
            {
                name: "Mailing list",
                href: "https://groups.google.com/g/openalex-users",
            },
            {
                name: "Twitter",
                href: "https://twitter.com/openalex_org",
            },
        ],

    },


]


export {
    navConfigs,
}