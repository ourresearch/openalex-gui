const navConfigs = [
    {
        name: "Product",
        links: [
            {
                name: "Search",
                to: "/",
            },
            // Compare ships when /compare exists (oxjob stub; see #685 decision map D4)
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
            // Careers ships when the jobs page lands (jobs-page oxjob)
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
                name: "Members",
                to: "/members",
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


const trustBadges = [
    {
        eyebrow: "501(c)(3)",
        name: "Nonprofit",
        icon: "mdi-charity",
        to: "/about",
    },
    {
        eyebrow: "CC0",
        name: "Open Data",
        icon: "mdi-creative-commons",
        href: "https://developers.openalex.org/",
    },
    {
        eyebrow: "MIT",
        name: "Open Source",
        icon: "mdi-github",
        href: "https://github.com/ourresearch",
    },
]


export {
    navConfigs,
    trustBadges,
}
