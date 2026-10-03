// Who can see a collection (oxjob #646, #1532): the API's `access` value and the one
// word and icon the website uses for each, everywhere (SERP rows, pickers, the
// collection page, settings, admin). One word per concept: "Public", "Private",
// "Shared by link".

export const ACCESS = {
    private: { label: "Private", icon: "mdi-lock-outline", help: "Only its owner can see it." },
    shared_by_link: {
        label: "Shared by link",
        icon: "mdi-link-variant",
        help: "Anyone with the link can view it. It isn't listed anywhere.",
    },
    public: {
        label: "Public",
        icon: "mdi-earth",
        help: "Made by OpenAlex. Anyone can find it, view it and filter by it.",
    },
};

export function accessInfo(access) {
    return ACCESS[access] || ACCESS.private;
}
