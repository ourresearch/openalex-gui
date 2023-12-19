const navConfigs = [
    {
        name: "About",
        icon: "mdi-information-outline",
        links: [
            {
                name: "Overview",
                to: "/about",
            },
            {
                name: "Testimonials",
                to: "/testimonials",
            },
            {
                name: "Coverage stats",
                to: "/stats",
            },
        ],

    },
    {
        name: "Learn more",
        icon: "mdi-book-open-outline",
        links: [
            // {
            //     name: "How-to guides",
            //     href: "https://cookbook.openalex.org/",
            // },
            {
                name: "API reference",
                href: "https://docs.openalex.org/",
            },
            {
                name: "Data reference",
                href: "https://help.openalex.org/",
            },
            {
                name: "Upgrade",
                to: "/pricing",
            },
            {
                name: "Privacy policy",
                href: "OpenAlex_privacy_policy.pdf",
            },
            {
                name: "Source Code",
                href: "https://github.com/ourresearch",
            },
        ],

    },

    {
        name: "Connect",
        icon: "mdi-chat-outline",
        links: [
            {
                name: "Contact",
                to: "/help",
            },
            {
                name: "Webinars",
                to: "/webinars",
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