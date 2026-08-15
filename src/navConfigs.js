const navConfigs = [
    {
        name: "Product",
        links: [
            {
                name: "Search",
                to: "/",
            },
            {
                name: "Compare",
                to: "/compare",
            },
            {
                name: "Pricing",
                to: "/pricing",
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
        name: "Developers",
        links: [
            {
                name: "API docs",
                href: "https://developers.openalex.org/",
            },
            {
                name: "Data snapshot",
                href: "https://developers.openalex.org/download/overview",
            },
            {
                name: "Status",
                href: "https://status.openalex.org/",
            },
            {
                name: "Source code",
                href: "https://github.com/ourresearch",
            },
        ],
    },
    {
        name: "Organization",
        links: [
            {
                name: "About",
                to: "/about",
            },
            {
                name: "Team",
                to: "/team",
            },
            {
                name: "Testimonials",
                to: "/testimonials",
            },
            {
                name: "Brand",
                to: "/brand",
            },
            {
                name: "Jobs",
                to: "/jobs",
            },
        ],
    },
    {
        name: "Community",
        links: [
            {
                name: "Help center",
                href: "https://help.openalex.org/",
            },
            {
                name: "Contact",
                to: "/contact",
            },
            {
                name: "Events",
                to: "/events",
            },
            {
                name: "Blog",
                href: "https://blog.openalex.org",
            },
            {
                name: "Mailing list",
                href: "https://groups.google.com/g/openalex-users",
            },
            {
                name: "Supporters",
                to: "/institutional-supporters",
            },
        ],
    },
    {
        name: "Legal",
        links: [
            {
                name: "Privacy",
                to: "/privacy",
            },
            {
                name: "Accessibility",
                to: "/accessibility",
            },
            {
                name: "Terms",
                to: "/terms",
            },
        ],
    },
]


import ccZeroIcon from "@/assets/cc-zero.svg"

// Plain text + logo marks, not links (Jason 2026-07-30)
const trustBadges = [
    {
        name: "Nonprofit",
        icon: "mdi-charity",
    },
    {
        name: "Open Data",
        img: ccZeroIcon,  // official CC0 mark (creativecommons.org press kit)
    },
    {
        name: "Open Source",
        icon: "mdi-open-source-initiative",  // OSI keyhole
    },
]


export {
    navConfigs,
    trustBadges,
}
