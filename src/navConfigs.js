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


// ---------------------------------------------------------------------------
// Site top bar mega-dropdowns (oxjob #778 round 3).
//
// Product rows mirror the help center's own curated "Products" section:
// https://help.openalex.org/access/overview/ — the "Best for" descriptions are
// copied verbatim from that page; if it changes, update these to match.
// Static on purpose (no fetch). "Website" points at this site's own root, not
// a help page.
// ---------------------------------------------------------------------------
const siteNavProduct = [
    {
        name: "Website",
        desc: "Exploring, one-off questions, exporting result lists",
        to: "/",
        icon: "mdi-magnify",
    },
    {
        name: "Agents",
        desc: "Letting your AI agent query OpenAlex for you",
        href: "https://help.openalex.org/access/agents/",
        icon: "mdi-robot-outline",
    },
    {
        name: "API",
        desc: "Apps, scripts, and analyses that need live data",
        href: "https://help.openalex.org/api/",
        icon: "mdi-code-braces",
    },
    {
        name: "CLI",
        desc: "Bulk downloads from your terminal, with retries and resume built in",
        href: "https://help.openalex.org/access/cli/",
        icon: "mdi-console",
    },
    {
        name: "Snapshot",
        desc: "Your own copy of the entire database, updated quarterly",
        href: "https://help.openalex.org/access/snapshot/",
        icon: "mdi-database-outline",
    },
    {
        name: "Sync",
        desc: "Keeping your copy fresh with daily updates",
        href: "https://help.openalex.org/access/sync/",
        icon: "mdi-autorenew",
    },
    {
        name: "Fulltext",
        desc: "Full-text PDFs and TEI XML, per-file or the whole archive",
        href: "https://help.openalex.org/access/fulltext/",
        icon: "mdi-file-document-outline",
    },
    {
        name: "Unpaywall",
        desc: "Legacy Unpaywall integrations and OA lookups by DOI",
        href: "https://help.openalex.org/access/unpaywall/",
        icon: "mdi-lock-open-outline",
    },
]

// Help dropdown mirrors the Product panel exactly (oxjob #778 follow-up, Jason
// 2026-08-16): a flat grid of icon-tile items each with a short description,
// instead of the old plain Learn/Reference link columns. Items still mirror
// help.openalex.org's top tabs; the column-major grid keeps the Learn items
// (col 1) and Reference items (col 2) grouped spatially without needing labels.
const siteNavHelp = [
    {
        name: "Quickstart",
        desc: "Get your first results in a few minutes",
        href: "https://help.openalex.org/quickstart/",
        icon: "mdi-rocket-launch-outline",
    },
    {
        name: "How-to",
        desc: "Short recipes for common tasks",
        href: "https://help.openalex.org/how-to/",
        icon: "mdi-format-list-checks",
    },
    {
        name: "Tutorials",
        desc: "Longer, worked walkthroughs end to end",
        href: "https://help.openalex.org/tutorials/",
        icon: "mdi-school-outline",
    },
    {
        name: "Data",
        desc: "How OpenAlex data is structured and defined",
        href: "https://help.openalex.org/data/",
        icon: "mdi-file-tree-outline",
    },
    {
        name: "API",
        desc: "Endpoints, parameters, and query syntax",
        href: "https://help.openalex.org/api/",
        icon: "mdi-api",
    },
    {
        name: "Access",
        desc: "Every way to get OpenAlex data",
        href: "https://help.openalex.org/access/",
        icon: "mdi-download-outline",
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
    siteNavProduct,
    siteNavHelp,
}
