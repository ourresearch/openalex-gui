// Short labels for `listed_in` values: external journal lists a source appears on
// (oxjob #1205). The API returns bare ids (`key_display_name === key`), so the
// GUI labels them here. Non-normative by design: a label names the list or its
// maintainer, never a verdict ("recommended", "quality").
const listedInLabels = {
    "doyens": "Doyens de Médecine (FR)",
    "cwts-core": "CWTS Core",
    "doaj": "DOAJ",
    // phase-4 batch (oxjob #1205); ids appear once the registry loads land
    "medline": "MEDLINE",
    // level registers: one list per level; ids and labels keep the maintainer's own level names
    "norway-1": "Norwegian Register, level 1",
    "norway-2": "Norwegian Register, level 2",
    "jufo-1": "JUFO (Finland), level 1",
    "jufo-2": "JUFO (Finland), level 2",
    "jufo-3": "JUFO (Finland), level 3",
    "jpps-1": "JPPS, one star",
    "jpps-2": "JPPS, two stars",
    "jpps-3": "JPPS, three stars",
    "latindex": "Latindex Catálogo 2.0",
    "erih-plus": "ERIH PLUS",
    "scielo": "SciELO",
};

const isListedInKey = (filterKey) =>
    filterKey === "listed_in" || !!filterKey?.endsWith(".listed_in");

const listedInLabel = (id) => listedInLabels[String(id).toLowerCase()] ?? id;

export { listedInLabels, isListedInKey, listedInLabel };
