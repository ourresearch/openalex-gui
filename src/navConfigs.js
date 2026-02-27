const navConfigs = [
    {
        name: "Product",
        icon: "mdi-book-open-outline",
        links: [
            {
                name: "Knowledge base",
                href: "https://help.openalex.org/",
            },
            {
                name: "API",
                href: "https://developers.openalex.org/",
            },
            {
                name: "Pricing",
                href: "https://help.openalex.org/pricing",
            },
            {
                name: "Repositories",
                to: "/repositories",
            },
            {
                name: "Unpaywall",
                href: "https://unpaywall.org/",
            },
            {
                name: "Unsub",
                href: "https://unsub.org/",
            },
        ],

    },
    {
        name: "Organization",
        icon: "mdi-information-outline",
        links: [
            {
                name: "Team",
                to: "/team",
            },
            {
                name: "Transparency",
                to: "/transparency",
            },
            {
                name: "Testimonials",
                to: "/testimonials",
            },
            {
                name: "Legal",
                to: "/legal",
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
                name: "Twitter/X",
                href: "https://twitter.com/openalex_org",
            },
            {
                name: "GitHub",
                href: "https://github.com/ourresearch",
            },
            {
                name: "Blog",
                href: "https://blog.openalex.org",
            },
        ],

    },


]


export {
    navConfigs,
}