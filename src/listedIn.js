// Short labels for `listed_in` values: external journal lists a source appears on
// (oxjob #1205). The API returns bare ids (`key_display_name === key`), so the
// GUI labels them here. Non-normative by design: a label names the list or its
// maintainer, never a verdict ("recommended", "quality").
const listedInLabels = {
    "doyens": "Doyens de Médecine (FR)",
    "cwts-core": "CWTS Core",
    "doaj": "DOAJ",
};

const isListedInKey = (filterKey) =>
    filterKey === "listed_in" || !!filterKey?.endsWith(".listed_in");

const listedInLabel = (id) => listedInLabels[String(id).toLowerCase()] ?? id;

export { listedInLabels, isListedInKey, listedInLabel };
