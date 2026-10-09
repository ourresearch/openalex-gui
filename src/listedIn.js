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
    // batch 4 (oxjob #1288)
    "ki-jl-1": "KI Journal List, level 1",
    "ki-jl-2": "KI Journal List, level 2",
    "ki-jl-3": "KI Journal List, level 3",
    "abdc-a-star": "ABDC, A*",
    "abdc-a": "ABDC, A",
    "abdc-b": "ABDC, B",
    "abdc-c": "ABDC, C",
    // batch 5 (oxjob #1615); a few count down (A* / 1* / A1 / level 1 = top): the list page says which
    "russia-white-list-1": "Russian White List, level 1",
    "russia-white-list-2": "Russian White List, level 2",
    "russia-white-list-3": "Russian White List, level 3",
    "russia-white-list-4": "Russian White List, level 4",
    "poland-200": "Polish journal list, 200 points",
    "poland-140": "Polish journal list, 140 points",
    "poland-100": "Polish journal list, 100 points",
    "poland-70": "Polish journal list, 70 points",
    "poland-40": "Polish journal list, 40 points",
    "poland-20": "Polish journal list, 20 points",
    "vabb-shw": "VABB-SHW (Flanders)",
    "fnege-1-star": "FNEGE (France), 1*",
    "fnege-1": "FNEGE (France), 1",
    "fnege-2": "FNEGE (France), 2",
    "fnege-3": "FNEGE (France), 3",
    "fnege-4": "FNEGE (France), 4",
    "tr-dizin": "TR Dizin (Türkiye)",
    "dhet": "DHET (South Africa)",
    "ft50": "FT50",
    "utd24": "UTD24",
    "anvur-class-a": "ANVUR Class A (Italy)",
    "anvur-scientific": "ANVUR scientific (Italy)",
    "kci-excellent": "KCI Excellent (Korea)",
    "kci-registered": "KCI Registered (Korea)",
    "kci-candidate": "KCI Candidate (Korea)",
    "ccf-a": "CCF (China), class A",
    "ccf-b": "CCF (China), class B",
    "ccf-c": "CCF (China), class C",
    "fecyt-seal": "FECYT seal (Spain)",
    "nbra": "Núcleo Básico (Argentina)",
    "publindex-a1": "Publindex (Colombia), A1",
    "publindex-a2": "Publindex (Colombia), A2",
    "publindex-b": "Publindex (Colombia), B",
    "publindex-c": "Publindex (Colombia), C",
    "publindex-recognized": "Publindex (Colombia), recognized",
    "dongbi-a": "Dongbi Index (China), A",
    "dongbi-b": "Dongbi Index (China), B",
    "dongbi-c": "Dongbi Index (China), C",
    "dongbi-d": "Dongbi Index (China), D",
};

const isListedInKey = (filterKey) =>
    filterKey === "listed_in" || !!filterKey?.endsWith(".listed_in");

const listedInLabel = (id) => listedInLabels[String(id).toLowerCase()] ?? id;

export { listedInLabels, isListedInKey, listedInLabel };
