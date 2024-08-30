// copy/pasted from https://api.openalex.org/entities/config
import _ from "lodash"

const getConfigs = () => _.cloneDeep(oaxConfigs)
export {getConfigs}


const oaxConfigs = {
    "authors": {
        "id": "authors",
        "icon": "mdi-account-outline",
        "name": "authors",
        "nameSingular": "author",
        "displayName": "authors",
        "displayNameSingular": "author",
        "descr": "Creators of scholarly works",
        "eg": "Albert Einstein",
        "placeholder": "Search scholarly authors",
        "filterName": "author",
        "filterKey": "authorships.author.id",
        "descrFull": "These are the creators of scholarly works. They can be affiliated with institutions, have ORCIDs, and have published works. Each author has a unique OpenAlex ID.",
        "hintVerb": "at",
        "color": "green",
        "hasAutocomplete": true,
        "isNative": true,
        "hasSerp": true,
        "highlightFilters": [{
            "key": "has_orcid",
            "value": true,
            "displayName": "with ORCIDs"
        }, {"key": "last_known_institutions.is_global_south", "value": true, "displayName": "from the Global South"}],
        "idRegex": "(?i)(?:authors\\/)?(?:https:\\/\\/openalex\\.org\\/)?(a\\d+)",
        "showOnEntityPage": ["id", "display_name", "display_name_alternatives", "last_known_institutions.id", "affiliations.institution.id", "ids.orcid"],
        "showOnTablePage": ["display_name", "ids.orcid", "last_known_institutions.id"],
        "groupByDefaults": ["last_known_institutions.id", "last_known_institutions.country_code", "has_orcid"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "authors",
                "entityId": "authors",
                "objectEntity": "authors",
                "displayName": "OpenAlex ID",
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "actionsPopular": [],
                "isId": true,
                "icon": "mdi-account-outline",
                "descr": "A unique identifier for each author that can be used for filtering works by author."
            },
            "ids.orcid": {
                "id": "ids.orcid",
                "subjectEntity": "authors",
                "entityId": "authors",
                "objectEntity": null,
                "displayName": "ORCID",
                "isId": true,
                "redshiftDisplayColumn": "orcid",
                "redshiftFilterColumn": "orcid",
                "actions": ["column", "filter"],
                "type": "string",
                "icon": "mdi-account-outline",
                "descr": "A common identifier for researchers that can be used to link their works across databases."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "authors",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "icon": "mdi-account-outline",
                "descr": "The name of the author."
            },
            "affiliations.institution.id": {
                "id": "affiliations.institution.id",
                "isList": true,
                "subjectEntity": "authors",
                "displayName": "Past institutions",
                "entityId": "institutions",
                "objectEntity": "institutions",
                "type": "array",
                "redshiftDisplayColumn": "affiliations",
                "redshiftFilterColumn": null,
                "actions": ["column"],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "The institutions that the author has been affiliated with."
            },
            "affiliations.institution.type": {
                "id": "affiliations.institution.type",
                "isList": true,
                "isId": true,
                "subjectEntity": "authors",
                "entityId": "institution-types",
                "objectEntity": "institution-types",
                "displayName": "Past institutions type",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": ["filter", "group_by"],
                "actionsPopular": ["filter"],
                "icon": "mdi-shape-outline",
                "descr": "The type of institutions that the author has been affiliated with which are taking from ROR."
            },
            "last_known_institutions.id": {
                "id": "last_known_institutions.id",
                "isList": true,
                "subjectEntity": "authors",
                "displayName": "institution",
                "entityId": "institutions",
                "objectEntity": "institutions",
                "type": "array",
                "redshiftDisplayColumn": "last_known_institutions",
                "redshiftFilterColumn": null,
                "actions": ["column", "filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-town-hall",
                "descr": "The latest institution that the author has been affiliated with in OpenAlex."
            },
            "last_known_institutions.country_code": {
                "id": "last_known_institutions.country_code",
                "isList": true,
                "subjectEntity": "authors",
                "entityId": "countries",
                "objectEntity": "countries",
                "isId": true,
                "displayName": "institution country",
                "type": "array",
                "isCountry": true,
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": ["filter", "group_by"],
                "actionsPopular": ["filter", "group_by"],
                "icon": "mdi-earth",
                "descr": "The country of the latest institution that the author has been affiliated with in OpenAlex."
            },
            "last_known_institutions.type": {
                "id": "last_known_institutions.type",
                "isList": true,
                "subjectEntity": "authors",
                "entityId": "institution-types",
                "objectEntity": "institution-types",
                "displayName": "Institution type",
                "isId": true,
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": ["filter", "group_by"],
                "actionsPopular": ["filter"],
                "icon": "mdi-shape-outline",
                "descr": "The type of the latest institution that the author has been affiliated with in OpenAlex."
            },
            "has_orcid": {
                "id": "has_orcid",
                "subjectEntity": "authors",
                "entityId": "authors",
                "objectEntity": null,
                "displayName": "Has an ORCID",
                "type": "boolean",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": ["filter", "group_by"],
                "actionsPopular": ["filter", "group_by"],
                "icon": "mdi-tag-outline",
                "descr": "Whether the author has an ORCID."
            },
            "display_name_alternatives": {
                "id": "display_name_alternatives",
                "isList": true,
                "subjectEntity": "authors",
                "entityId": "authors",
                "objectEntity": null,
                "displayName": "alternate names",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "type": "array",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "Alternate names of the author which are determined from the raw author name of all works associated with an author."
            },
            "count(works)": {
                "id": "count(works)",
                "subjectEntity": "authors",
                "entityId": "works",
                "objectEntity": null,
                "displayName": "works count",
                "type": "number",
                "redshiftDisplayColumn": "count(works)",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "icon": "mdi-book-open-variant",
                "descr": "The number of works that the author has created."
            }
        },
        "values": null
    }, "concepts": {
        "id": "concepts",
        "icon": "mdi-tag-outline",
        "name": "concepts",
        "nameSingular": "concept",
        "displayName": "concepts",
        "displayNameSingular": "concept",
        "descr": "Concepts and fields of study",
        "eg": "History",
        "placeholder": "Search topics",
        "filterName": "concepts",
        "filterKey": "concepts.id",
        "descrFull": "These are concepts or fields of study that were inherited from MAG (Microsoft Academic Graph). Each concept has a unique OpenAlex ID.",
        "hasAutocomplete": true,
        "isNative": true,
        "idRegex": "(?i)(?:concepts\\/)?(?:https:\\/\\/openalex\\.org\\/)?(c\\d+)",
        "showOnEntityPage": ["id", "display_name", "description"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "concepts",
                "entityId": "concepts",
                "objectEntity": "concepts",
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "icon": "mdi-tag-outline",
                "descr": "Unique identifier for this concept"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "concepts",
                "displayName": "name",
                "type": "string",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of this concept or field of study"
            },
            "description": {
                "id": "description",
                "subjectEntity": "concepts",
                "entityId": "concepts",
                "objectEntity": "concepts",
                "displayName": "description",
                "type": "string",
                "icon": "mdi-tag-outline",
                "descr": "A description of this concept or field of study"
            },
            "display_name.search": {
                "id": "display_name.search",
                "subjectEntity": "concepts",
                "displayName": "Name search",
                "type": "string",
                "icon": "mdi-magnify",
                "descr": "Display name for search"
            },
            "level": {
                "id": "level",
                "subjectEntity": "concepts",
                "displayName": "Level",
                "maxPotentialFiltersToShow": 10,
                "type": "number",
                "icon": "mdi-tag-outline",
                "descr": "The level of this concept in the hierarchy of concepts from level 0 to level 6"
            }
        },
        "values": null
    }, "continents": {
        "id": "continents",
        "icon": "mdi-earth",
        "name": "continents",
        "nameSingular": "continent",
        "displayName": "continents",
        "displayNameSingular": "continent",
        "descr": "Continents",
        "eg": "Africa",
        "placeholder": "Search continents",
        "filterName": "continent",
        "filterKey": "authorships.institutions.continent",
        "descrFull": "These are the continents of the world. Each continent has a unique OpenAlex ID.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?i)(?:https:\\/\\/openalex\\.org\\/continents\\/|continents\\/)(q\\d+)",
        "showOnEntityPage": ["id", "display_name", "countries"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "continents",
                "entityId": "continents",
                "objectEntity": null,
                "isId": true,
                "displayName": "Continent ID",
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": ["filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-shape-outline",
                "descr": "Unique identifier for the continent"
            },
            "display_name": {
                "id": "display_name",
                "subjectEntity": "continents",
                "entityId": "continents",
                "objectEntity": null,
                "displayName": "Continent name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["column"],
                "actionsPopular": [],
                "icon": "mdi-shape-outline",
                "descr": "The name of the continent"
            }
        },
        "values": [{"id": "continents/Q15", "display_name": "Africa"}, {
            "id": "continents/Q18",
            "display_name": "South America"
        }, {"id": "continents/Q46", "display_name": "Europe"}, {
            "id": "continents/Q48",
            "display_name": "Asia"
        }, {"id": "continents/Q49", "display_name": "North America"}, {
            "id": "continents/Q51",
            "display_name": "Antarctica"
        }, {"id": "continents/Q55643", "display_name": "Oceania"}]
    }, "countries": {
        "id": "countries",
        "icon": "mdi-earth",
        "name": "countries",
        "nameSingular": "country",
        "displayName": "countries",
        "displayNameSingular": "country",
        "descr": "Countries",
        "eg": "Nigeria",
        "placeholder": "Search countries",
        "filterName": "countries",
        "filterKey": "authorships.countries",
        "descrFull": "These are countries. Each country has a unique OpenAlex ID.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/countries\\/|countries\\/)([a-zA-Z]{2})",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "countries",
                "entityId": "countries",
                "objectEntity": null,
                "displayName": "Country ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "icon": "mdi-tag-outline",
                "descr": "Unique identifier for the country"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "countries",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "icon": "mdi-account-outline",
                "descr": "The name of the country"
            }
        },
        "values": [{"id": "countries/US", "display_name": "United States of America"}, {
            "id": "countries/CN",
            "display_name": "China"
        }, {
            "id": "countries/GB",
            "display_name": "United Kingdom of Great Britain and Northern Ireland"
        }, {"id": "countries/DE", "display_name": "Germany"}, {
            "id": "countries/JP",
            "display_name": "Japan"
        }, {"id": "countries/FR", "display_name": "France"}, {
            "id": "countries/IN",
            "display_name": "India"
        }, {"id": "countries/CA", "display_name": "Canada"}, {
            "id": "countries/IT",
            "display_name": "Italy"
        }, {"id": "countries/BR", "display_name": "Brazil"}, {
            "id": "countries/AU",
            "display_name": "Australia"
        }, {"id": "countries/ES", "display_name": "Spain"}, {
            "id": "countries/RU",
            "display_name": "Russian Federation"
        }, {"id": "countries/ID", "display_name": "Indonesia"}, {
            "id": "countries/NL",
            "display_name": "Netherlands"
        }, {"id": "countries/KR", "display_name": "Korea, Republic of"}, {
            "id": "countries/PL",
            "display_name": "Poland"
        }, {"id": "countries/CH", "display_name": "Switzerland"}, {
            "id": "countries/TR",
            "display_name": "Turkey"
        }, {"id": "countries/SE", "display_name": "Sweden"}, {
            "id": "countries/BE",
            "display_name": "Belgium"
        }, {"id": "countries/IR", "display_name": "Iran, Islamic Republic of"}, {
            "id": "countries/TW",
            "display_name": "Taiwan, Province of China"
        }, {"id": "countries/MX", "display_name": "Mexico"}, {
            "id": "countries/DK",
            "display_name": "Denmark"
        }, {"id": "countries/AT", "display_name": "Austria"}, {
            "id": "countries/IL",
            "display_name": "Israel"
        }, {"id": "countries/PT", "display_name": "Portugal"}, {
            "id": "countries/NO",
            "display_name": "Norway"
        }, {"id": "countries/CZ", "display_name": "Czechia"}, {
            "id": "countries/FI",
            "display_name": "Finland"
        }, {"id": "countries/ZA", "display_name": "South Africa"}, {
            "id": "countries/MY",
            "display_name": "Malaysia"
        }, {"id": "countries/EG", "display_name": "Egypt"}, {
            "id": "countries/GR",
            "display_name": "Greece"
        }, {"id": "countries/AR", "display_name": "Argentina"}, {
            "id": "countries/SG",
            "display_name": "Singapore"
        }, {"id": "countries/UA", "display_name": "Ukraine"}, {
            "id": "countries/SA",
            "display_name": "Saudi Arabia"
        }, {"id": "countries/NZ", "display_name": "New Zealand"}, {
            "id": "countries/PK",
            "display_name": "Pakistan"
        }, {"id": "countries/CO", "display_name": "Colombia"}, {
            "id": "countries/IE",
            "display_name": "Ireland"
        }, {"id": "countries/HU", "display_name": "Hungary"}, {
            "id": "countries/CL",
            "display_name": "Chile"
        }, {"id": "countries/HK", "display_name": "Hong Kong"}, {
            "id": "countries/NG",
            "display_name": "Nigeria"
        }, {"id": "countries/RO", "display_name": "Romania"}, {
            "id": "countries/TH",
            "display_name": "Thailand"
        }, {"id": "countries/HR", "display_name": "Croatia"}, {
            "id": "countries/SK",
            "display_name": "Slovakia"
        }, {"id": "countries/BD", "display_name": "Bangladesh"}, {
            "id": "countries/RS",
            "display_name": "Serbia"
        }, {"id": "countries/VN", "display_name": "Viet Nam"}, {
            "id": "countries/IQ",
            "display_name": "Iraq"
        }, {"id": "countries/MA", "display_name": "Morocco"}, {
            "id": "countries/BG",
            "display_name": "Bulgaria"
        }, {"id": "countries/PE", "display_name": "Peru"}, {
            "id": "countries/SI",
            "display_name": "Slovenia"
        }, {"id": "countries/TN", "display_name": "Tunisia"}, {
            "id": "countries/DZ",
            "display_name": "Algeria"
        }, {"id": "countries/CU", "display_name": "Cuba"}, {
            "id": "countries/AE",
            "display_name": "United Arab Emirates"
        }, {"id": "countries/PA", "display_name": "Panama"}, {
            "id": "countries/EC",
            "display_name": "Ecuador"
        }, {"id": "countries/PH", "display_name": "Philippines"}, {
            "id": "countries/KE",
            "display_name": "Kenya"
        }, {"id": "countries/ET", "display_name": "Ethiopia"}, {
            "id": "countries/VE",
            "display_name": "Venezuela, Bolivarian Republic of"
        }, {"id": "countries/JO", "display_name": "Jordan"}, {
            "id": "countries/LT",
            "display_name": "Lithuania"
        }, {"id": "countries/GH", "display_name": "Ghana"}, {
            "id": "countries/NP",
            "display_name": "Nepal"
        }, {"id": "countries/KZ", "display_name": "Kazakhstan"}, {
            "id": "countries/QA",
            "display_name": "Qatar"
        }, {"id": "countries/EE", "display_name": "Estonia"}, {
            "id": "countries/BY",
            "display_name": "Belarus"
        }, {"id": "countries/CR", "display_name": "Costa Rica"}, {
            "id": "countries/LB",
            "display_name": "Lebanon"
        }, {"id": "countries/CY", "display_name": "Cyprus"}, {
            "id": "countries/LK",
            "display_name": "Sri Lanka"
        }, {"id": "countries/LU", "display_name": "Luxembourg"}, {
            "id": "countries/UZ",
            "display_name": "Uzbekistan"
        }, {"id": "countries/LV", "display_name": "Latvia"}, {
            "id": "countries/UY",
            "display_name": "Uruguay"
        }, {"id": "countries/PR", "display_name": "Puerto Rico"}, {
            "id": "countries/TZ",
            "display_name": "Tanzania, United Republic of"
        }, {"id": "countries/UG", "display_name": "Uganda"}, {
            "id": "countries/CM",
            "display_name": "Cameroon"
        }, {"id": "countries/KW", "display_name": "Kuwait"}, {
            "id": "countries/OM",
            "display_name": "Oman"
        }, {"id": "countries/MO", "display_name": "Macao"}, {
            "id": "countries/AZ",
            "display_name": "Azerbaijan"
        }, {"id": "countries/IS", "display_name": "Iceland"}, {
            "id": "countries/BA",
            "display_name": "Bosnia and Herzegovina"
        }, {"id": "countries/TJ", "display_name": "Tajikistan"}, {
            "id": "countries/AM",
            "display_name": "Armenia"
        }, {"id": "countries/GE", "display_name": "Georgia"}, {
            "id": "countries/BO",
            "display_name": "Bolivia, Plurinational State of"
        }, {"id": "countries/SD", "display_name": "Sudan"}, {
            "id": "countries/MN",
            "display_name": "Mongolia"
        }, {"id": "countries/ZW", "display_name": "Zimbabwe"}, {
            "id": "countries/MK",
            "display_name": "North Macedonia"
        }, {"id": "countries/SN", "display_name": "Senegal"}, {
            "id": "countries/MD",
            "display_name": "Moldova, Republic of"
        }, {"id": "countries/CI", "display_name": "C\u00f4te d'Ivoire"}, {
            "id": "countries/YE",
            "display_name": "Yemen"
        }, {"id": "countries/ZM", "display_name": "Zambia"}, {
            "id": "countries/SS",
            "display_name": "South Sudan"
        }, {"id": "countries/MZ", "display_name": "Mozambique"}, {
            "id": "countries/KH",
            "display_name": "Cambodia"
        }, {"id": "countries/PS", "display_name": "Palestine, State of"}, {
            "id": "countries/BJ",
            "display_name": "Benin"
        }, {"id": "countries/MT", "display_name": "Malta"}, {
            "id": "countries/PY",
            "display_name": "Paraguay"
        }, {"id": "countries/BH", "display_name": "Bahrain"}, {
            "id": "countries/GT",
            "display_name": "Guatemala"
        }, {"id": "countries/AL", "display_name": "Albania"}, {
            "id": "countries/BF",
            "display_name": "Burkina Faso"
        }, {"id": "countries/MW", "display_name": "Malawi"}, {
            "id": "countries/ML",
            "display_name": "Mali"
        }, {"id": "countries/JM", "display_name": "Jamaica"}, {
            "id": "countries/MM",
            "display_name": "Myanmar"
        }, {"id": "countries/SY", "display_name": "Syrian Arab Republic"}, {
            "id": "countries/CD",
            "display_name": "Congo, Democratic Republic of the"
        }, {"id": "countries/BW", "display_name": "Botswana"}, {
            "id": "countries/NE",
            "display_name": "Niger"
        }, {"id": "countries/LY", "display_name": "Libya"}, {
            "id": "countries/RE",
            "display_name": "R\u00e9union"
        }, {"id": "countries/BN", "display_name": "Brunei Darussalam"}, {
            "id": "countries/BI",
            "display_name": "Burundi"
        }, {"id": "countries/VG", "display_name": "Virgin Islands, British"}, {
            "id": "countries/RW",
            "display_name": "Rwanda"
        }, {"id": "countries/ME", "display_name": "Montenegro"}, {
            "id": "countries/SV",
            "display_name": "El Salvador"
        }, {"id": "countries/XK", "display_name": "Kosovo"}, {
            "id": "countries/CG",
            "display_name": "Congo"
        }, {"id": "countries/TT", "display_name": "Trinidad and Tobago"}, {
            "id": "countries/NI",
            "display_name": "Nicaragua"
        }, {"id": "countries/KG", "display_name": "Kyrgyzstan"}, {
            "id": "countries/MG",
            "display_name": "Madagascar"
        }, {"id": "countries/HN", "display_name": "Honduras"}, {
            "id": "countries/DO",
            "display_name": "Dominican Republic"
        }, {"id": "countries/NA", "display_name": "Namibia"}, {
            "id": "countries/FJ",
            "display_name": "Fiji"
        }, {"id": "countries/MU", "display_name": "Mauritius"}, {
            "id": "countries/GP",
            "display_name": "Guadeloupe"
        }, {"id": "countries/AF", "display_name": "Afghanistan"}, {
            "id": "countries/PG",
            "display_name": "Papua New Guinea"
        }, {"id": "countries/AO", "display_name": "Angola"}, {
            "id": "countries/TG",
            "display_name": "Togo"
        }, {"id": "countries/GM", "display_name": "Gambia"}, {
            "id": "countries/ST",
            "display_name": "Sao Tome and Principe"
        }, {"id": "countries/GA", "display_name": "Gabon"}, {
            "id": "countries/GD",
            "display_name": "Grenada"
        }, {"id": "countries/LA", "display_name": "Lao People's Democratic Republic"}, {
            "id": "countries/GN",
            "display_name": "Guinea"
        }, {"id": "countries/SL", "display_name": "Sierra Leone"}, {
            "id": "countries/MC",
            "display_name": "Monaco"
        }, {"id": "countries/BB", "display_name": "Barbados"}, {
            "id": "countries/LI",
            "display_name": "Liechtenstein"
        }, {"id": "countries/NC", "display_name": "New Caledonia"}, {
            "id": "countries/GW",
            "display_name": "Guinea-Bissau"
        }, {"id": "countries/PF", "display_name": "French Polynesia"}, {
            "id": "countries/MQ",
            "display_name": "Martinique"
        }, {"id": "countries/GL", "display_name": "Greenland"}, {
            "id": "countries/GF",
            "display_name": "French Guiana"
        }, {"id": "countries/BT", "display_name": "Bhutan"}, {
            "id": "countries/AG",
            "display_name": "Antigua and Barbuda"
        }, {"id": "countries/GU", "display_name": "Guam"}, {
            "id": "countries/SZ",
            "display_name": "Eswatini"
        }, {"id": "countries/HT", "display_name": "Haiti"}, {
            "id": "countries/TD",
            "display_name": "Chad"
        }, {"id": "countries/GY", "display_name": "Guyana"}, {
            "id": "countries/SO",
            "display_name": "Somalia"
        }, {"id": "countries/KN", "display_name": "Saint Kitts and Nevis"}, {
            "id": "countries/MF",
            "display_name": "Saint Martin (French part)"
        }, {"id": "countries/LS", "display_name": "Lesotho"}, {
            "id": "countries/BS",
            "display_name": "Bahamas"
        }, {"id": "countries/CW", "display_name": "Cura\u00e7ao"}, {
            "id": "countries/LR",
            "display_name": "Liberia"
        }, {"id": "countries/TM", "display_name": "Turkmenistan"}, {
            "id": "countries/MV",
            "display_name": "Maldives"
        }, {"id": "countries/BM", "display_name": "Bermuda"}, {
            "id": "countries/FO",
            "display_name": "Faroe Islands"
        }, {"id": "countries/VI", "display_name": "Virgin Islands, U.S."}, {
            "id": "countries/SR",
            "display_name": "Suriname"
        }, {"id": "countries/BZ", "display_name": "Belize"}, {
            "id": "countries/CF",
            "display_name": "Central African Republic"
        }, {"id": "countries/MR", "display_name": "Mauritania"}, {
            "id": "countries/ER",
            "display_name": "Eritrea"
        }, {"id": "countries/CV", "display_name": "Cabo Verde"}, {
            "id": "countries/DM",
            "display_name": "Dominica"
        }, {"id": "countries/KY", "display_name": "Cayman Islands"}, {
            "id": "countries/KP",
            "display_name": "Korea, Democratic People's Republic of"
        }, {"id": "countries/GI", "display_name": "Gibraltar"}, {
            "id": "countries/SC",
            "display_name": "Seychelles"
        }, {"id": "countries/VA", "display_name": "Vatican City"}, {
            "id": "countries/TL",
            "display_name": "Timor-Leste"
        }, {"id": "countries/SM", "display_name": "San Marino"}, {
            "id": "countries/AD",
            "display_name": "Andorra"
        }, {"id": "countries/AI", "display_name": "Anguilla"}, {
            "id": "countries/AQ",
            "display_name": "Antarctica"
        }, {"id": "countries/AS", "display_name": "American Samoa"}, {
            "id": "countries/AW",
            "display_name": "Aruba"
        }, {"id": "countries/AX", "display_name": "\u00c5land Islands"}, {
            "id": "countries/BL",
            "display_name": "Saint Barth\u00e9lemy"
        }, {"id": "countries/BQ", "display_name": "Bonaire, Sint Eustatius and Saba"}, {
            "id": "countries/BV",
            "display_name": "Bouvet Island"
        }, {"id": "countries/CC", "display_name": "Cocos (Keeling) Islands"}, {
            "id": "countries/CK",
            "display_name": "Cook Islands"
        }, {"id": "countries/CX", "display_name": "Christmas Island"}, {
            "id": "countries/DJ",
            "display_name": "Djibouti"
        }, {"id": "countries/FK", "display_name": "Falkland Islands (Malvinas)"}, {
            "id": "countries/FM",
            "display_name": "Micronesia, Federated States of"
        }, {"id": "countries/GG", "display_name": "Guernsey"}, {
            "id": "countries/GQ",
            "display_name": "Equatorial Guinea"
        }, {
            "id": "countries/GS",
            "display_name": "South Georgia and the South Sandwich Islands"
        }, {"id": "countries/HM", "display_name": "Heard Island and McDonald Islands"}, {
            "id": "countries/IM",
            "display_name": "Isle of Man"
        }, {"id": "countries/IO", "display_name": "British Indian Ocean Territory"}, {
            "id": "countries/JE",
            "display_name": "Jersey"
        }, {"id": "countries/KI", "display_name": "Kiribati"}, {
            "id": "countries/KM",
            "display_name": "Comoros"
        }, {"id": "countries/LC", "display_name": "Saint Lucia"}, {
            "id": "countries/MH",
            "display_name": "Marshall Islands"
        }, {"id": "countries/MP", "display_name": "Northern Mariana Islands"}, {
            "id": "countries/MS",
            "display_name": "Montserrat"
        }, {"id": "countries/NF", "display_name": "Norfolk Island"}, {
            "id": "countries/NR",
            "display_name": "Nauru"
        }, {"id": "countries/NU", "display_name": "Niue"}, {
            "id": "countries/PM",
            "display_name": "Saint Pierre and Miquelon"
        }, {"id": "countries/PN", "display_name": "Pitcairn"}, {
            "id": "countries/PW",
            "display_name": "Palau"
        }, {"id": "countries/SB", "display_name": "Solomon Islands"}, {
            "id": "countries/SH",
            "display_name": "Saint Helena, Ascension and Tristan da Cunha"
        }, {"id": "countries/SJ", "display_name": "Svalbard and Jan Mayen"}, {
            "id": "countries/SX",
            "display_name": "Sint Maarten"
        }, {"id": "countries/TC", "display_name": "Turks and Caicos Islands"}, {
            "id": "countries/TK",
            "display_name": "Tokelau"
        }, {"id": "countries/TO", "display_name": "Tonga"}, {
            "id": "countries/TV",
            "display_name": "Tuvalu"
        }, {"id": "countries/VC", "display_name": "Saint Vincent and the Grenadines"}, {
            "id": "countries/VU",
            "display_name": "Vanuatu"
        }, {"id": "countries/WF", "display_name": "Wallis and Futuna"}, {
            "id": "countries/WS",
            "display_name": "Samoa"
        }, {"id": "countries/YT", "display_name": "Mayotte"}]
    }, "domains": {
        "id": "domains",
        "icon": "mdi-tag-outline",
        "name": "domains",
        "nameSingular": "domain",
        "displayName": "domains",
        "displayNameSingular": "domain",
        "descr": "what works are about",
        "eg": "Life sciences",
        "placeholder": "Search domains",
        "filterName": "domains",
        "filterKey": "primary_topic.domain.id",
        "descrFull": "These are the domains of scholarly works which are the highest level description for a subject area of a work. Each domain has a unique OpenAlex ID.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/domains\\/|domains\\/)(\\d+)",
        "showOnEntityPage": ["id", "display_name", "description", "display_name_alternatives", "fields", "siblings"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "domains",
                "entityId": "domains",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "icon": "mdi-tag-outline",
                "descr": "Unique identifier for the domain"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "domains",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the domain"
            },
            "description": {
                "id": "description",
                "subjectEntity": "domains",
                "entityId": "domains",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": null,
                "actions": ["column"],
                "icon": "mdi-tag-outline",
                "descr": "A description of the domain"
            },
            "fields": {
                "id": "fields",
                "isList": true,
                "subjectEntity": "domains",
                "entityId": "fields",
                "objectEntity": null,
                "displayName": "fields (children)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The set of fields that are children of this domain"
            },
            "siblings": {
                "id": "siblings",
                "isList": true,
                "subjectEntity": "domains",
                "entityId": "domains",
                "objectEntity": "domains",
                "displayName": "other domains (siblings)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The set of domains that are siblings of this domain"
            }
        },
        "values": [{"id": "domains/3", "display_name": "Physical Sciences"}, {
            "id": "domains/2",
            "display_name": "Social Sciences"
        }, {"id": "domains/4", "display_name": "Health Sciences"}, {"id": "domains/1", "display_name": "Life Sciences"}]
    }, "fields": {
        "id": "fields",
        "icon": "mdi-tag-outline",
        "name": "fields",
        "nameSingular": "field",
        "displayName": "fields",
        "displayNameSingular": "field",
        "descr": "what works are about",
        "eg": "Computer science",
        "placeholder": "Search fields",
        "filterName": "fields",
        "filterKey": "primary_topic.field.id",
        "descrFull": "Fields the second level of description of the subject area of works. Each field has a unique OpenAlex ID. Fields are above subfields but below domains in the hierarchy of research areas in OpenAlex.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/fields\\/|fields\\/)(\\d+)",
        "showOnEntityPage": ["id", "display_name", "description", "display_name_alternatives", "subfields", "siblings", "domain"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "fields",
                "entityId": "fields",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "icon": "mdi-tag-outline",
                "descr": "Unique identifier for the field"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "fields",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the field"
            },
            "description": {
                "id": "description",
                "subjectEntity": "fields",
                "entityId": "fields",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "actions": ["column"],
                "icon": "mdi-tag-outline",
                "descr": "A description of the field"
            },
            "display_name_alternatives": {
                "id": "display_name_alternatives",
                "isList": true,
                "subjectEntity": "fields",
                "entityId": "fields",
                "objectEntity": null,
                "displayName": "alternate names",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "Alternate names for the field"
            },
            "siblings": {
                "id": "siblings",
                "isList": true,
                "subjectEntity": "fields",
                "entityId": "fields",
                "objectEntity": "fields",
                "displayName": "related fields (siblings)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "Fields that are related to this field"
            },
            "subfields": {
                "id": "subfields",
                "isList": true,
                "subjectEntity": "fields",
                "entityId": "subfields",
                "objectEntity": "subfields",
                "displayName": "subfields (children)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The set of subfields that are children of this field"
            },
            "domain": {
                "id": "domain",
                "subjectEntity": "fields",
                "entityId": "domains",
                "objectEntity": "domains",
                "displayName": "domain (parent)",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The domain that is the parent of this field"
            }
        },
        "values": [{"id": "fields/27", "display_name": "Medicine"}, {
            "id": "fields/33",
            "display_name": "Social Sciences"
        }, {"id": "fields/22", "display_name": "Engineering"}, {
            "id": "fields/12",
            "display_name": "Arts and Humanities"
        }, {"id": "fields/17", "display_name": "Computer Science"}, {
            "id": "fields/13",
            "display_name": "Biochemistry, Genetics and Molecular Biology"
        }, {"id": "fields/11", "display_name": "Agricultural and Biological Sciences"}, {
            "id": "fields/23",
            "display_name": "Environmental Science"
        }, {"id": "fields/31", "display_name": "Physics and Astronomy"}, {
            "id": "fields/25",
            "display_name": "Materials Science"
        }, {"id": "fields/14", "display_name": "Business, Management and Accounting"}, {
            "id": "fields/20",
            "display_name": "Economics, Econometrics and Finance"
        }, {"id": "fields/36", "display_name": "Health Professions"}, {
            "id": "fields/32",
            "display_name": "Psychology"
        }, {"id": "fields/16", "display_name": "Chemistry"}, {
            "id": "fields/19",
            "display_name": "Earth and Planetary Sciences"
        }, {"id": "fields/28", "display_name": "Neuroscience"}, {
            "id": "fields/26",
            "display_name": "Mathematics"
        }, {"id": "fields/24", "display_name": "Immunology and Microbiology"}, {
            "id": "fields/18",
            "display_name": "Decision Sciences"
        }, {"id": "fields/21", "display_name": "Energy"}, {
            "id": "fields/29",
            "display_name": "Nursing"
        }, {"id": "fields/30", "display_name": "Pharmacology, Toxicology and Pharmaceutics"}, {
            "id": "fields/35",
            "display_name": "Dentistry"
        }, {"id": "fields/15", "display_name": "Chemical Engineering"}, {
            "id": "fields/34",
            "display_name": "Veterinary"
        }]
    }, "funders": {
        "id": "funders",
        "icon": "mdi-cash-multiple",
        "name": "funders",
        "nameSingular": "funder",
        "displayName": "funders",
        "displayNameSingular": "funder",
        "descr": "Organization funding works via grants",
        "eg": "US National Science Foundation",
        "placeholder": "Search research funders",
        "filterName": "grants.funder",
        "filterKey": "grants.funder",
        "descrFull": "These are the organizations that fund research works via grants. Each funder has a unique OpenAlex ID.",
        "color": "brown",
        "hasAutocomplete": true,
        "isNative": true,
        "idRegex": "(?i)(?:funders\\/)?(?:https:\\/\\/openalex\\.org\\/)?(f\\d+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name", "doi", "country_code", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "funders",
                "entityId": "funders",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-cash-multiple",
                "descr": "Unique identifier for the funder"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "funders",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the funder"
            },
            "country_code": {
                "id": "country_code",
                "subjectEntity": "funders",
                "entityId": "countries",
                "objectEntity": "countries",
                "displayName": "Country",
                "isId": true,
                "type": "object",
                "isExternalId": true,
                "externalIdPrefix": "countries",
                "isCountry": true,
                "redshiftDisplayColumn": "country_code_formatted",
                "redshiftFilterColumn": "country_code",
                "actions": ["column", "filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-earth",
                "descr": "The country in which the funder is based"
            },
            "doi": {
                "id": "doi",
                "subjectEntity": "funders",
                "entityId": "works",
                "objectEntity": null,
                "displayName": "DOI",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "doi",
                "redshiftFilterColumn": "doi",
                "category": "ids",
                "actions": ["column", "filter"],
                "icon": "mdi-file-document-outline",
                "descr": "The DOI of the funder"
            },
            "crossref_id": {
                "id": "crossref_id",
                "subjectEntity": "funders",
                "objectEntity": null,
                "displayName": "crossref id",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "crossref_id",
                "redshiftFilterColumn": "crossref_id",
                "category": "ids",
                "actions": ["column"],
                "icon": "mdi-file-document-outline",
                "descr": "The crossref id of the funder"
            },
            "description": {
                "id": "description",
                "subjectEntity": "funders",
                "objectEntity": null,
                "displayName": "description",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "category": "ids",
                "actions": ["column"],
                "icon": "mdi-file-document-outline",
                "descr": "A description of the funder"
            }
        },
        "values": null
    }, "institution-types": {
        "id": "institution-types",
        "icon": "mdi-shape-outline",
        "name": "institution-types",
        "nameSingular": "institution type",
        "displayName": "institution types",
        "displayNameSingular": "institution type",
        "descr": "institution type",
        "eg": "company",
        "placeholder": "Search institution types",
        "filterName": "institution type",
        "filterKey": "authorships.institutions.type",
        "descrFull": "The type of institution as seen in ROR",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/institution-types\\/|institution-types\\/)([a-zA-Z\\-]+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "institution-types",
                "entityId": "institution-types",
                "objectEntity": null,
                "displayName": "Institution ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the institution type"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "institution-types",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the institution type"
            }
        },
        "values": [{
            "id": "institution-types/education",
            "display_name": "education"
        }, {"id": "institution-types/healthcare", "display_name": "healthcare"}, {
            "id": "institution-types/facility",
            "display_name": "facility"
        }, {"id": "institution-types/government", "display_name": "government"}, {
            "id": "institution-types/company",
            "display_name": "company"
        }, {"id": "institution-types/nonprofit", "display_name": "nonprofit"}, {
            "id": "institution-types/other",
            "display_name": "other"
        }, {"id": "institution-types/archive", "display_name": "archive"}]
    }, "institutions": {
        "id": "institutions",
        "icon": "mdi-town-hall",
        "name": "institutions",
        "nameSingular": "institution",
        "displayName": "institutions",
        "displayNameSingular": "institution",
        "descr": "Institutions (universities and research centers)",
        "eg": "Harvard University",
        "placeholder": "Search academic institutions",
        "filterName": "institutions",
        "filterKey": "authorships.institutions.lineage",
        "descrFull": "The institution (university or research center) where an author is affiliated. All institutions have a Research Organization Registry (ROR) ID.",
        "hintVerb": "in",
        "color": "purple",
        "hasAutocomplete": true,
        "isNative": true,
        "hasSerp": true,
        "showOnEntityPage": ["id", "display_name", "display_name_alternatives", "parent_institutions", "child_institutions", "related_institutions", "ids.ror"],
        "showOnTablePage": ["display_name", "type", "country_code", "ids.ror"],
        "idRegex": "(?i)(?:institutions\\/)?(?:https:\\/\\/openalex\\.org\\/)?(i\\d+)",
        "groupByDefaults": ["country_code", "type"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "institutions",
                "entityId": "institutions",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "isId": true,
                "type": "string",
                "icon": "mdi-town-hall",
                "descr": "The unique identifier for the institution in OpenAlex"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "institutions",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the institution"
            },
            "ids.ror": {
                "id": "ids.ror",
                "subjectEntity": "institutions",
                "entityId": "institutions",
                "objectEntity": null,
                "displayName": "ROR",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "ror",
                "redshiftFilterColumn": "ror",
                "icon": "mdi-town-hall",
                "descr": "The unique identifier for the institution in the Research Organization Registry (ROR)"
            },
            "country_code": {
                "id": "country_code",
                "subjectEntity": "institutions",
                "entityId": "countries",
                "objectEntity": "countries",
                "displayName": "Country",
                "isId": true,
                "type": "object",
                "isExternalId": true,
                "externalIdPrefix": "countries",
                "isCountry": true,
                "redshiftDisplayColumn": "country_code_formatted",
                "redshiftFilterColumn": "country_code",
                "actions": ["filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-earth",
                "descr": "The country where the institution is located"
            },
            "type": {
                "id": "type",
                "subjectEntity": "institutions",
                "entityId": "institution-types",
                "objectEntity": "institution-types",
                "displayName": "Institution type",
                "redshiftDisplayColumn": "type_formatted",
                "redshiftFilterColumn": "type",
                "isExternalId": true,
                "externalIdPrefix": "institution-types",
                "isId": true,
                "type": "object",
                "actions": ["column", "filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-shape-outline",
                "descr": "The type of institution as seen in ROR"
            },
            "display_name_alternatives": {
                "id": "display_name_alternatives",
                "isList": true,
                "subjectEntity": "institutions",
                "objectEntity": null,
                "displayName": "alternate names",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "type": "string",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "Alternative names or acronyms for the institution"
            },
            "parent_institutions": {
                "id": "parent_institutions",
                "isList": true,
                "subjectEntity": "institutions",
                "objectEntity": "institutions",
                "displayName": "parent institutions",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "type": "array",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "The parent institutions of the institution"
            },
            "child_institutions": {
                "id": "child_institutions",
                "isList": true,
                "subjectEntity": "institutions",
                "objectEntity": "institutions",
                "displayName": "child institutions",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "type": "array",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "The child institutions of the institution"
            },
            "related_institutions": {
                "id": "related_institutions",
                "isList": true,
                "subjectEntity": "institutions",
                "objectEntity": "institutions",
                "displayName": "related institutions",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "type": "array",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-town-hall",
                "descr": "Other institutions that are related to the institution"
            },
            "mean(fwci)": {
                "id": "mean(fwci)",
                "subjectEntity": "institutions",
                "objectEntity": null,
                "displayName": "mean fwci",
                "type": "number",
                "redshiftDisplayColumn": "mean_fwci",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "icon": "mdi-book-open-variant",
                "descr": "The mean Field-Weighted Citation Impact (FWCI) of the institution across all works"
            },
            "count(works)": {
                "id": "count",
                "subjectEntity": "institutions",
                "objectEntity": null,
                "displayName": "works count",
                "type": "number",
                "redshiftDisplayColumn": "count(works)",
                "redshiftFilterColumn": "count(works)",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "icon": "mdi-book-open-variant",
                "descr": "The number of works affiliated with the institution in OpenAlex"
            }
        },
        "count(citations)": {
            "id": "count(citations)",
            "subjectEntity": "institutions",
            "objectEntity": null,
            "displayName": "citation count",
            "type": "number",
            "redshiftDisplayColumn": "count(citations)",
            "redshiftFilterColumn": "count(citations)",
            "actions": ["sort", "column"],
            "actionsPopular": ["sort", "column"],
            "icon": "mdi-book-open-variant",
            "descr": "The count of citations for this institution in OpenAlex"
        },
        "values": null
    }, "keywords": {
        "id": "keywords",
        "icon": "mdi-tag-outline",
        "name": "keywords",
        "nameSingular": "keyword",
        "displayName": "keywords",
        "displayNameSingular": "keyword",
        "descr": "what works are about",
        "eg": "Cardiac imaging",
        "placeholder": "Search keywords",
        "filterName": "keywords",
        "filterKey": "keywords.id",
        "descrFull": "Keywords are the lowest level of categorization for works. They are used to specifically describe a work.",
        "hintVerb": ":",
        "hasAutocomplete": true,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/keywords\\/|keywords\\/)([a-zA-Z0-9\\-]+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "keywords",
                "entityId": "keywords",
                "objectEntity": null,
                "displayName": "Keyword ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the keyword in OpenAlex"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "keywords",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the keyword"
            },
            "count(works)": {
                "id": "count(works)",
                "subjectEntity": "keywords",
                "objectEntity": null,
                "displayName": "works count",
                "type": "number",
                "redshiftDisplayColumn": "count(works)",
                "redshiftFilterColumn": "count(works)",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The number of works that have this keyword"
            }
        },
        "values": null
    }, "languages": {
        "id": "languages",
        "icon": "mdi-translate",
        "name": "languages",
        "nameSingular": "language",
        "displayName": "languages",
        "displayNameSingular": "language",
        "descr": "Languages",
        "eg": "Swahili",
        "placeholder": "Search languages",
        "filterName": "languages",
        "filterKey": "language",
        "descrFull": "Language that has been assigned to this work by OpenAlex. Languages are assigned to works based on the language of the work title or abstract.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/languages\\/|languages\\/)([a-zA-Z]{2})",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "languages",
                "entityId": "languages",
                "objectEntity": null,
                "displayName": "Language ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the language in OpenAlex"
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "languages",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the language"
            }
        },
        "values": [{"id": "languages/en", "display_name": "English"}, {
            "id": "languages/ja",
            "display_name": "Japanese"
        }, {"id": "languages/es", "display_name": "Spanish"}, {
            "id": "languages/de",
            "display_name": "German"
        }, {"id": "languages/fr", "display_name": "French"}, {
            "id": "languages/ko",
            "display_name": "Korean"
        }, {"id": "languages/pt", "display_name": "Portuguese"}, {
            "id": "languages/id",
            "display_name": "Indonesian"
        }, {"id": "languages/ru", "display_name": "Russian"}, {
            "id": "languages/it",
            "display_name": "Italian"
        }, {"id": "languages/pl", "display_name": "Polish"}, {
            "id": "languages/nl",
            "display_name": "Dutch"
        }, {"id": "languages/tr", "display_name": "Turkish"}, {
            "id": "languages/ca",
            "display_name": "Catalan"
        }, {"id": "languages/ar", "display_name": "Arabic"}, {
            "id": "languages/fa",
            "display_name": "Persian"
        }, {"id": "languages/sv", "display_name": "Swedish"}, {
            "id": "languages/uk",
            "display_name": "Ukrainian"
        }, {"id": "languages/cs", "display_name": "Czech"}, {
            "id": "languages/ro",
            "display_name": "Romanian"
        }, {"id": "languages/hr", "display_name": "Croatian"}, {
            "id": "languages/no",
            "display_name": "Norwegian"
        }, {"id": "languages/da", "display_name": "Danish"}, {
            "id": "languages/af",
            "display_name": "Afrikaans"
        }, {"id": "languages/fi", "display_name": "Finnish"}, {
            "id": "languages/el",
            "display_name": "Modern Greek (1453-)"
        }, {"id": "languages/vi", "display_name": "Vietnamese"}, {
            "id": "languages/et",
            "display_name": "Estonian"
        }, {"id": "languages/hu", "display_name": "Hungarian"}, {
            "id": "languages/tl",
            "display_name": "Tagalog"
        }, {"id": "languages/sl", "display_name": "Slovenian"}, {
            "id": "languages/lt",
            "display_name": "Lithuanian"
        }, {"id": "languages/cy", "display_name": "Welsh"}, {
            "id": "languages/th",
            "display_name": "Thai"
        }, {"id": "languages/sk", "display_name": "Slovak"}, {
            "id": "languages/bg",
            "display_name": "Bulgarian"
        }, {"id": "languages/lv", "display_name": "Latvian"}, {
            "id": "languages/sw",
            "display_name": "Swahili (macrolanguage)"
        }, {"id": "languages/so", "display_name": "Somali"}, {
            "id": "languages/mk",
            "display_name": "Macedonian"
        }, {"id": "languages/sq", "display_name": "Albanian"}, {
            "id": "languages/hi",
            "display_name": "Hindi"
        }, {"id": "languages/he", "display_name": "Hebrew"}, {
            "id": "languages/ur",
            "display_name": "Urdu"
        }, {"id": "languages/ne", "display_name": "Nepali (macrolanguage)"}, {
            "id": "languages/mr",
            "display_name": "Marathi"
        }, {"id": "languages/ta", "display_name": "Tamil"}, {
            "id": "languages/bn",
            "display_name": "Bengali"
        }, {"id": "languages/gu", "display_name": "Gujarati"}, {
            "id": "languages/ml",
            "display_name": "Malayalam"
        }, {"id": "languages/kn", "display_name": "Kannada"}, {
            "id": "languages/te",
            "display_name": "Telugu"
        }, {"id": "languages/pa", "display_name": "Panjabi"}, {
            "id": "languages/aa",
            "display_name": "Afar"
        }, {"id": "languages/ab", "display_name": "Abkhazian"}, {
            "id": "languages/ae",
            "display_name": "Avestan"
        }, {"id": "languages/ak", "display_name": "Akan"}, {
            "id": "languages/am",
            "display_name": "Amharic"
        }, {"id": "languages/an", "display_name": "Aragonese"}, {
            "id": "languages/as",
            "display_name": "Assamese"
        }, {"id": "languages/av", "display_name": "Avaric"}, {
            "id": "languages/ay",
            "display_name": "Aymara"
        }, {"id": "languages/az", "display_name": "Azerbaijani"}, {
            "id": "languages/ba",
            "display_name": "Bashkir"
        }, {"id": "languages/be", "display_name": "Belarusian"}, {
            "id": "languages/bi",
            "display_name": "Bislama"
        }, {"id": "languages/bm", "display_name": "Bambara"}, {
            "id": "languages/bo",
            "display_name": "Tibetan"
        }, {"id": "languages/br", "display_name": "Breton"}, {
            "id": "languages/bs",
            "display_name": "Bosnian"
        }, {"id": "languages/ce", "display_name": "Chechen"}, {
            "id": "languages/ch",
            "display_name": "Chamorro"
        }, {"id": "languages/co", "display_name": "Corsican"}, {
            "id": "languages/cr",
            "display_name": "Cree"
        }, {"id": "languages/cu", "display_name": "Church Slavic"}, {
            "id": "languages/cv",
            "display_name": "Chuvash"
        }, {"id": "languages/dv", "display_name": "Dhivehi"}, {
            "id": "languages/dz",
            "display_name": "Dzongkha"
        }, {"id": "languages/ee", "display_name": "Ewe"}, {
            "id": "languages/eo",
            "display_name": "Esperanto"
        }, {"id": "languages/eu", "display_name": "Basque"}, {
            "id": "languages/ff",
            "display_name": "Fulah"
        }, {"id": "languages/fj", "display_name": "Fijian"}, {
            "id": "languages/fo",
            "display_name": "Faroese"
        }, {"id": "languages/fy", "display_name": "Western Frisian"}, {
            "id": "languages/ga",
            "display_name": "Irish"
        }, {"id": "languages/gd", "display_name": "Scottish Gaelic"}, {
            "id": "languages/gl",
            "display_name": "Galician"
        }, {"id": "languages/gn", "display_name": "Guarani"}, {
            "id": "languages/gv",
            "display_name": "Manx"
        }, {"id": "languages/ha", "display_name": "Hausa"}, {
            "id": "languages/ho",
            "display_name": "Hiri Motu"
        }, {"id": "languages/ht", "display_name": "Haitian"}, {
            "id": "languages/hy",
            "display_name": "Armenian"
        }, {"id": "languages/hz", "display_name": "Herero"}, {
            "id": "languages/ia",
            "display_name": "Interlingua (International Auxiliary Language Association)"
        }, {"id": "languages/ie", "display_name": "Interlingue"}, {
            "id": "languages/ig",
            "display_name": "Igbo"
        }, {"id": "languages/ii", "display_name": "Sichuan Yi"}, {
            "id": "languages/ik",
            "display_name": "Inupiaq"
        }, {"id": "languages/io", "display_name": "Ido"}, {
            "id": "languages/is",
            "display_name": "Icelandic"
        }, {"id": "languages/iu", "display_name": "Inuktitut"}, {
            "id": "languages/jv",
            "display_name": "Javanese"
        }, {"id": "languages/ka", "display_name": "Georgian"}, {
            "id": "languages/kg",
            "display_name": "Kongo"
        }, {"id": "languages/ki", "display_name": "Kikuyu"}, {
            "id": "languages/kj",
            "display_name": "Kuanyama"
        }, {"id": "languages/kk", "display_name": "Kazakh"}, {
            "id": "languages/kl",
            "display_name": "Kalaallisut"
        }, {"id": "languages/km", "display_name": "Central Khmer"}, {
            "id": "languages/kr",
            "display_name": "Kanuri"
        }, {"id": "languages/ks", "display_name": "Kashmiri"}, {
            "id": "languages/ku",
            "display_name": "Kurdish"
        }, {"id": "languages/kv", "display_name": "Komi"}, {
            "id": "languages/kw",
            "display_name": "Cornish"
        }, {"id": "languages/ky", "display_name": "Kirghiz"}, {
            "id": "languages/la",
            "display_name": "Latin"
        }, {"id": "languages/lb", "display_name": "Luxembourgish"}, {
            "id": "languages/lg",
            "display_name": "Ganda"
        }, {"id": "languages/li", "display_name": "Limburgan"}, {
            "id": "languages/ln",
            "display_name": "Lingala"
        }, {"id": "languages/lo", "display_name": "Lao"}, {
            "id": "languages/lu",
            "display_name": "Luba-Katanga"
        }, {"id": "languages/mg", "display_name": "Malagasy"}, {
            "id": "languages/mh",
            "display_name": "Marshallese"
        }, {"id": "languages/mi", "display_name": "Maori"}, {
            "id": "languages/mn",
            "display_name": "Mongolian"
        }, {"id": "languages/ms", "display_name": "Malay (macrolanguage)"}, {
            "id": "languages/mt",
            "display_name": "Maltese"
        }, {"id": "languages/my", "display_name": "Burmese"}, {
            "id": "languages/na",
            "display_name": "Nauru"
        }, {"id": "languages/nb", "display_name": "Norwegian Bokm\u00e5l"}, {
            "id": "languages/nd",
            "display_name": "North Ndebele"
        }, {"id": "languages/ng", "display_name": "Ndonga"}, {
            "id": "languages/nn",
            "display_name": "Norwegian Nynorsk"
        }, {"id": "languages/nr", "display_name": "South Ndebele"}, {
            "id": "languages/nv",
            "display_name": "Navajo"
        }, {"id": "languages/ny", "display_name": "Nyanja"}, {
            "id": "languages/oc",
            "display_name": "Occitan (post 1500)"
        }, {"id": "languages/oj", "display_name": "Ojibwa"}, {
            "id": "languages/om",
            "display_name": "Oromo"
        }, {"id": "languages/or", "display_name": "Oriya (macrolanguage)"}, {
            "id": "languages/os",
            "display_name": "Ossetian"
        }, {"id": "languages/pi", "display_name": "Pali"}, {
            "id": "languages/ps",
            "display_name": "Pushto"
        }, {"id": "languages/qu", "display_name": "Quechua"}, {
            "id": "languages/rm",
            "display_name": "Romansh"
        }, {"id": "languages/rn", "display_name": "Rundi"}, {
            "id": "languages/rw",
            "display_name": "Kinyarwanda"
        }, {"id": "languages/sa", "display_name": "Sanskrit"}, {
            "id": "languages/sc",
            "display_name": "Sardinian"
        }, {"id": "languages/sd", "display_name": "Sindhi"}, {
            "id": "languages/se",
            "display_name": "Northern Sami"
        }, {"id": "languages/sg", "display_name": "Sango"}, {
            "id": "languages/sh",
            "display_name": "Serbo-Croatian"
        }, {"id": "languages/si", "display_name": "Sinhala"}, {
            "id": "languages/sm",
            "display_name": "Samoan"
        }, {"id": "languages/sn", "display_name": "Shona"}, {
            "id": "languages/sr",
            "display_name": "Serbian"
        }, {"id": "languages/ss", "display_name": "Swati"}, {
            "id": "languages/st",
            "display_name": "Southern Sotho"
        }, {"id": "languages/su", "display_name": "Sundanese"}, {
            "id": "languages/tg",
            "display_name": "Tajik"
        }, {"id": "languages/ti", "display_name": "Tigrinya"}, {
            "id": "languages/tk",
            "display_name": "Turkmen"
        }, {"id": "languages/tn", "display_name": "Tswana"}, {
            "id": "languages/to",
            "display_name": "Tonga (Tonga Islands)"
        }, {"id": "languages/ts", "display_name": "Tsonga"}, {
            "id": "languages/tt",
            "display_name": "Tatar"
        }, {"id": "languages/tw", "display_name": "Twi"}, {
            "id": "languages/ty",
            "display_name": "Tahitian"
        }, {"id": "languages/ug", "display_name": "Uighur"}, {
            "id": "languages/uz",
            "display_name": "Uzbek"
        }, {"id": "languages/ve", "display_name": "Venda"}, {
            "id": "languages/vo",
            "display_name": "Volap\u00fck"
        }, {"id": "languages/wa", "display_name": "Walloon"}, {
            "id": "languages/wo",
            "display_name": "Wolof"
        }, {"id": "languages/xh", "display_name": "Xhosa"}, {
            "id": "languages/yi",
            "display_name": "Yiddish"
        }, {"id": "languages/yo", "display_name": "Yoruba"}, {
            "id": "languages/za",
            "display_name": "Zhuang"
        }, {"id": "languages/zh", "display_name": "Chinese"}, {"id": "languages/zu", "display_name": "Zulu"}]
    }, "licenses": {
        "id": "licenses",
        "icon": "mdi-lock-open-outline",
        "name": "licenses",
        "nameSingular": "license",
        "displayName": "licenses",
        "displayNameSingular": "license",
        "descr": "license of best open copy",
        "eg": "CC-BY",
        "placeholder": "Search licenses",
        "filterName": "institution type",
        "filterKey": "best_oa_location.license",
        "descrFull": "The license of the best open copy of the work.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/licenses\\/|licenses\\/)([a-zA-Z0-9\\-]+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "licenses",
                "entityId": "licenses",
                "objectEntity": null,
                "displayName": "License ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the license in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "licenses",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the license."
            },
            "description": {
                "id": "description",
                "subjectEntity": "licenses",
                "entityId": "licenses",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "actions": ["column"],
                "icon": "mdi-shape-outline",
                "descr": "A description of the license."
            }
        },
        "values": [{"id": "licenses/cc-by", "display_name": "CC BY"}, {
            "id": "licenses/other-oa",
            "display_name": "other open access"
        }, {"id": "licenses/cc-by-nc-nd", "display_name": "CC BY-NC-ND"}, {
            "id": "licenses/cc-by-nc",
            "display_name": "CC BY-NC"
        }, {"id": "licenses/cc-by-nc-sa", "display_name": "CC BY-NC-SA"}, {
            "id": "licenses/publisher-specific-oa",
            "display_name": "publisher specific open access"
        }, {"id": "licenses/public-domain", "display_name": "public domain (CC0)"}, {
            "id": "licenses/cc-by-sa",
            "display_name": "CC BY-SA"
        }, {"id": "licenses/mit", "display_name": "MIT"}, {
            "id": "licenses/cc-by-nd",
            "display_name": "CC BY-ND"
        }, {"id": "licenses/gpl-v3", "display_name": "GNU GPLv3"}, {
            "id": "licenses/apache-2-0",
            "display_name": "Apache License 2.0"
        }, {"id": "licenses/isc", "display_name": "ISC License"}]
    }, "publishers": {
        "id": "publishers",
        "icon": "mdi-domain",
        "name": "publishers",
        "nameSingular": "publisher",
        "displayName": "publishers",
        "displayNameSingular": "publisher",
        "descr": "Company hosting journals",
        "eg": "Elsevier",
        "placeholder": "Search academic publishers",
        "filterName": "primary_location.source.publisher_lineage",
        "filterKey": "primary_location.source.publisher_lineage",
        "descrFull": "The publisher of scholarly articles, usually a company or organization.",
        "color": "pink",
        "hasAutocomplete": true,
        "isNative": true,
        "idRegex": "(?i)(?:publishers\\/)?(?:https:\\/\\/openalex\\.org\\/)?(p\\d+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name", "country_code"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "publishers",
                "entityId": "publishers",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-domain",
                "descr": "The unique identifier for the publisher in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "publishers",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the publisher."
            },
            "country_code": {
                "id": "country_code",
                "subjectEntity": "publishers",
                "entityId": "countries",
                "objectEntity": "countries",
                "displayName": "Country",
                "isId": true,
                "type": "object",
                "redshiftDisplayColumn": "country_code_formatted",
                "redshiftFilterColumn": "country_code",
                "isExternalId": true,
                "externalIdPrefix": "countries",
                "isCountry": true,
                "actions": ["filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-earth",
                "descr": "The country where the publisher is located."
            }
        },
        "values": null
    }, "sdgs": {
        "id": "sdgs",
        "icon": "mdi-sprout-outline",
        "name": "sdgs",
        "nameSingular": "sdg",
        "displayName": "Sustainable Development Goals",
        "displayNameSingular": "Sustainable Development Goal",
        "descr": "Relevant UN SDGs",
        "eg": "Clean water and sanitation",
        "placeholder": "Search SDGs",
        "filterName": "Sustainable Development Goals",
        "filterKey": "sustainable_development_goals.id",
        "descrFull": "The Sustainable Development Goals (SDGs) are a collection of 17 global goals set by the United Nations General Assembly in 2015 for the year 2030.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/sdgs\\/|sdgs\\/)(\\d+)",
        "showOnEntityPage": ["id", "display_name"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "sdgs",
                "entityId": "sdgs",
                "objectEntity": null,
                "displayName": "SDG ID",
                "isId": true,
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "type": "string",
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the Sustainable Development Goa (SDG) in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "sdgs",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the Sustainable Development Goal (SDG)."
            },
            "description": {
                "id": "description",
                "isColumnMandatory": true,
                "subjectEntity": "sdgs",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The description of the Sustainable Development Goal (SDG)."
            }
        },
        "values": [{"id": "sdgs/3", "display_name": "Good health and well-being"}, {
            "id": "sdgs/2",
            "display_name": "Zero hunger"
        }, {"id": "sdgs/4", "display_name": "Quality education"}, {
            "id": "sdgs/7",
            "display_name": "Affordable and clean energy"
        }, {"id": "sdgs/10", "display_name": "Reduced inequalities"}, {
            "id": "sdgs/16",
            "display_name": "Peace, justice, and strong institutions"
        }, {"id": "sdgs/8", "display_name": "Decent work and economic growth"}, {
            "id": "sdgs/11",
            "display_name": "Sustainable cities and communities"
        }, {"id": "sdgs/6", "display_name": "Clean water and sanitation"}, {
            "id": "sdgs/5",
            "display_name": "Gender equality"
        }, {"id": "sdgs/14", "display_name": "Life below water"}, {
            "id": "sdgs/15",
            "display_name": "Life on land"
        }, {"id": "sdgs/13", "display_name": "Climate action"}, {
            "id": "sdgs/9",
            "display_name": "Industry, innovation and infrastructure"
        }, {"id": "sdgs/17", "display_name": "Partnerships for the goals"}, {
            "id": "sdgs/1",
            "display_name": "No poverty"
        }, {"id": "sdgs/12", "display_name": "Responsible consumption and production"}]
    }, "source-types": {
        "id": "source-types",
        "icon": "mdi-shape-outline",
        "name": "source-types",
        "nameSingular": "source type",
        "displayName": "source types",
        "displayNameSingular": "source type",
        "descr": "Source type",
        "eg": "journal",
        "placeholder": "Search source types",
        "filterName": "source type",
        "filterKey": "primary_location.source.type",
        "descrFull": "The type of source, such as a journal, repository, or conference.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/source-types\\/|source-types\\/)([a-zA-Z\\-]+)",
        "showOnEntityPage": ["id", "display_name", "description"],
        "showOnTablePage": ["display_name"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "source-types",
                "entityId": "source-types",
                "objectEntity": null,
                "displayName": "Source Type ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-shape-outline",
                "descr": "The unique identifier for the source type in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "subjectEntity": "source-types",
                "objectEntity": null,
                "entityId": "source-types",
                "displayName": "Source type name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["column", "sort"],
                "actionsPopular": ["column"],
                "icon": "mdi-shape-outline",
                "descr": "The name of the source type."
            }
        },
        "values": [{"id": "source-types/journal", "display_name": "journal"}, {
            "id": "source-types/repository",
            "display_name": "repository"
        }, {"id": "source-types/ebook platform", "display_name": "ebook platform"}, {
            "id": "source-types/book series",
            "display_name": "book series"
        }, {"id": "source-types/conference", "display_name": "conference"}, {
            "id": "source-types/other",
            "display_name": "other"
        }]
    }, "sources": {
        "id": "sources",
        "icon": "mdi-book-open-outline",
        "name": "sources",
        "nameSingular": "source",
        "displayName": "sources",
        "displayNameSingular": "source",
        "descr": "Journals, conferences, and repositories",
        "eg": "The New England Journal of Medicine",
        "placeholder": "Search academic journals & repositories",
        "filterName": "primary_location.source",
        "filterKey": "primary_location.source.id",
        "descrFull": "The source or location of scholarly articles, such as a journal, conference, or repository.",
        "hintVerb": "published by",
        "color": "orange",
        "hasAutocomplete": true,
        "isNative": true,
        "hasSerp": true,
        "highlightFilters": [{"key": "is_oa", "value": true, "displayName": "that are Open Access"}],
        "idRegex": "(?i)(?:sources\\/)?(?:https:\\/\\/openalex\\.org\\/)?(s\\d+)",
        "showOnEntityPage": ["id", "display_name", "ids.issn", "type", "host_organization", "alternate_titles", "is_oa", "is_in_doaj", "apc_usd"],
        "showOnTablePage": ["display_name", "type", "ids.issn"],
        "groupByDefaults": ["type", "is_oa", "is_in_doaj"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "sources",
                "entityId": null,
                "objectEntity": "sources",
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-book-open-outline",
                "descr": "The unique identifier for the source in OpenAlex."
            },
            "ids.issn": {
                "id": "ids.issn",
                "subjectEntity": "sources",
                "objectEntity": null,
                "entityId": "sources",
                "displayName": "ISSNs",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "issn",
                "redshiftFilterColumn": "issn",
                "actions": ["column", "filter"],
                "icon": "mdi-book-open-outline",
                "descr": "The International Standard Serial Number (ISSN) of the source."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the source."
            },
            "host_organization": {
                "id": "host_organization",
                "subjectEntity": "sources",
                "entityId": "publishers",
                "objectEntity": "publishers",
                "displayName": "Publisher",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-domain",
                "descr": "The organization or publisher that publishes the source."
            },
            "type": {
                "id": "type",
                "subjectEntity": "sources",
                "entityId": "source-types",
                "objectEntity": "source-types",
                "displayName": "Source type",
                "isId": true,
                "isExternalId": true,
                "externalIdPrefix": "source-types",
                "type": "object",
                "redshiftDisplayColumn": "type_formatted",
                "redshiftFilterColumn": "type",
                "actions": ["column", "filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-shape-outline",
                "descr": "The type of source."
            },
            "apc_usd": {
                "id": "apc_usd",
                "isCurrency": true,
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "Article Processing Charge",
                "type": "number",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-cash",
                "descr": "The Article Processing Charge (APC) in USD for the source."
            },
            "is_oa": {
                "id": "is_oa",
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "Fully open access",
                "type": "boolean",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-lock-open-outline",
                "descr": "Whether the source is fully open access."
            },
            "is_in_doaj": {
                "id": "is_in_doaj",
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "In DOAJ",
                "type": "boolean",
                "redshiftDisplayColumn": "is_in_doaj",
                "redshiftFilterColumn": "is_in_doaj",
                "actions": ["column", "filter"],
                "actionsPopular": ["filter"],
                "icon": "mdi-lock-open-outline",
                "descr": "Whether the source is listed in the Directory of Open Access Journals (DOAJ)."
            },
            "alternate_titles": {
                "id": "alternate_titles",
                "isList": true,
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "alternate names",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "actionsPopular": [],
                "icon": "mdi-book-open-outline",
                "descr": "Alternate names for the source."
            },
            "count(works)": {
                "id": "count(works)",
                "subjectEntity": "sources",
                "objectEntity": null,
                "displayName": "works count",
                "type": "number",
                "redshiftDisplayColumn": "count(works)",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "icon": "mdi-book-open-variant",
                "descr": "The number of works published by the source."
            }
        },
        "values": null
    }, "subfields": {
        "id": "subfields",
        "icon": "mdi-tag-outline",
        "name": "subfields",
        "nameSingular": "subfield",
        "displayName": "subfields",
        "displayNameSingular": "subfield",
        "descr": "what works are about",
        "eg": "Molecular biology",
        "placeholder": "Search subfields",
        "filterName": "subfields",
        "filterKey": "primary_topic.subfield.id",
        "descrFull": "Subfields are the specific areas of research that a work is about. Subfields are below fields but above topics in the hierarchy of research areas in OpenAlex.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/subfields\\/|subfields\\/)(\\d+)",
        "showOnEntityPage": ["id", "display_name", "description", "topics", "siblings", "field", "domain"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "subfields",
                "entityId": "subfields",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the subfield in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "subfields",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the subfield."
            },
            "description": {
                "id": "description",
                "subjectEntity": "subfields",
                "entityId": "subfields",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "actions": ["column"],
                "icon": "mdi-tag-outline",
                "descr": "A description of the subfield."
            },
            "topics": {
                "id": "topics",
                "isList": true,
                "subjectEntity": "subfields",
                "entityId": "topics",
                "objectEntity": "topics",
                "displayName": "topics (children)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The topics that are children of this subfield."
            },
            "siblings": {
                "id": "siblings",
                "isList": true,
                "subjectEntity": "subfields",
                "entityId": "subfields",
                "objectEntity": "subfields",
                "displayName": "related subfields (siblings)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The subfields that are related to this subfield."
            },
            "field": {
                "id": "field",
                "subjectEntity": "subfields",
                "entityId": "fields",
                "objectEntity": "fields",
                "displayName": "field (parent)",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The field that is the parent of this subfield."
            },
            "domain": {
                "id": "domain",
                "subjectEntity": "subfields",
                "entityId": "domains",
                "objectEntity": "domains",
                "displayName": "domain",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The domain that is the parent of this subfield."
            }
        },
        "values": [{"id": "subfields/3312", "display_name": "Sociology and Political Science"}, {
            "id": "subfields/1312",
            "display_name": "Molecular Biology"
        }, {
            "id": "subfields/3320",
            "display_name": "Political Science and International Relations"
        }, {"id": "subfields/3304", "display_name": "Education"}, {
            "id": "subfields/2208",
            "display_name": "Electrical and Electronic Engineering"
        }, {"id": "subfields/2746", "display_name": "Surgery"}, {
            "id": "subfields/2505",
            "display_name": "Materials Chemistry"
        }, {"id": "subfields/2002", "display_name": "Economics and Econometrics"}, {
            "id": "subfields/1110",
            "display_name": "Plant Science"
        }, {"id": "subfields/3600", "display_name": "General Health Professions"}, {
            "id": "subfields/1702",
            "display_name": "Artificial Intelligence"
        }, {"id": "subfields/2210", "display_name": "Mechanical Engineering"}, {
            "id": "subfields/2204",
            "display_name": "Biomedical Engineering"
        }, {
            "id": "subfields/2739",
            "display_name": "Public Health, Environmental and Occupational Health"
        }, {"id": "subfields/2740", "display_name": "Pulmonary and Respiratory Medicine"}, {
            "id": "subfields/1710",
            "display_name": "Information Systems"
        }, {"id": "subfields/2713", "display_name": "Epidemiology"}, {
            "id": "subfields/1605",
            "display_name": "Organic Chemistry"
        }, {"id": "subfields/1208", "display_name": "Literature and Literary Theory"}, {
            "id": "subfields/1202",
            "display_name": "History"
        }, {
            "id": "subfields/3107",
            "display_name": "Atomic and Molecular Physics, and Optics"
        }, {"id": "subfields/3203", "display_name": "Clinical Psychology"}, {
            "id": "subfields/3103",
            "display_name": "Astronomy and Astrophysics"
        }, {"id": "subfields/2207", "display_name": "Control and Systems Engineering"}, {
            "id": "subfields/2205",
            "display_name": "Civil and Structural Engineering"
        }, {"id": "subfields/1311", "display_name": "Genetics"}, {
            "id": "subfields/1705",
            "display_name": "Computer Networks and Communications"
        }, {"id": "subfields/1408", "display_name": "Strategy and Management"}, {
            "id": "subfields/2705",
            "display_name": "Cardiology and Cardiovascular Medicine"
        }, {"id": "subfields/2737", "display_name": "Physiology"}, {
            "id": "subfields/3308",
            "display_name": "Law"
        }, {"id": "subfields/2730", "display_name": "Oncology"}, {
            "id": "subfields/2202",
            "display_name": "Aerospace Engineering"
        }, {"id": "subfields/2303", "display_name": "Ecology"}, {
            "id": "subfields/2741",
            "display_name": "Radiology, Nuclear Medicine and Imaging"
        }, {"id": "subfields/1203", "display_name": "Language and Linguistics"}, {
            "id": "subfields/2211",
            "display_name": "Mechanics of Materials"
        }, {"id": "subfields/3207", "display_name": "Social Psychology"}, {
            "id": "subfields/1204",
            "display_name": "Archeology"
        }, {"id": "subfields/3314", "display_name": "Anthropology"}, {
            "id": "subfields/1105",
            "display_name": "Ecology, Evolution, Behavior and Systematics"
        }, {"id": "subfields/1707", "display_name": "Computer Vision and Pattern Recognition"}, {
            "id": "subfields/1211",
            "display_name": "Philosophy"
        }, {"id": "subfields/2206", "display_name": "Computational Mechanics"}, {
            "id": "subfields/2308",
            "display_name": "Management, Monitoring, Policy and Law"
        }, {"id": "subfields/1106", "display_name": "Food Science"}, {
            "id": "subfields/2735",
            "display_name": "Pediatrics, Perinatology and Child Health"
        }, {"id": "subfields/2306", "display_name": "Global and Planetary Change"}, {
            "id": "subfields/1402",
            "display_name": "Accounting"
        }, {"id": "subfields/2805", "display_name": "Cognitive Neuroscience"}, {
            "id": "subfields/2212",
            "display_name": "Ocean Engineering"
        }, {"id": "subfields/2403", "display_name": "Immunology"}, {
            "id": "subfields/3316",
            "display_name": "Cultural Studies"
        }, {"id": "subfields/3106", "display_name": "Nuclear and High Energy Physics"}, {
            "id": "subfields/3317",
            "display_name": "Demography"
        }, {"id": "subfields/2725", "display_name": "Infectious Diseases"}, {
            "id": "subfields/2712",
            "display_name": "Endocrinology, Diabetes and Metabolism"
        }, {"id": "subfields/1902", "display_name": "Atmospheric Science"}, {
            "id": "subfields/2734",
            "display_name": "Pathology and Forensic Medicine"
        }, {"id": "subfields/1703", "display_name": "Computational Theory and Mathematics"}, {
            "id": "subfields/1908",
            "display_name": "Geophysics"
        }, {"id": "subfields/2728", "display_name": "Neurology"}, {
            "id": "subfields/2105",
            "display_name": "Renewable Energy, Sustainability and the Environment"
        }, {
            "id": "subfields/1803",
            "display_name": "Management Science and Operations Research"
        }, {"id": "subfields/2312", "display_name": "Water Science and Technology"}, {
            "id": "subfields/2736",
            "display_name": "Pharmacology"
        }, {"id": "subfields/2738", "display_name": "Psychiatry and Mental health"}, {
            "id": "subfields/2003",
            "display_name": "Finance"
        }, {"id": "subfields/2215", "display_name": "Building and Construction"}, {
            "id": "subfields/2209",
            "display_name": "Industrial and Manufacturing Engineering"
        }, {"id": "subfields/2745", "display_name": "Rheumatology"}, {
            "id": "subfields/3322",
            "display_name": "Urban Studies"
        }, {"id": "subfields/1307", "display_name": "Cell Biology"}, {
            "id": "subfields/1607",
            "display_name": "Spectroscopy"
        }, {"id": "subfields/2916", "display_name": "Nutrition and Dietetics"}, {
            "id": "subfields/2000",
            "display_name": "General Economics, Econometrics and Finance"
        }, {"id": "subfields/1207", "display_name": "History and Philosophy of Science"}, {
            "id": "subfields/1212",
            "display_name": "Religious studies"
        }, {"id": "subfields/3205", "display_name": "Experimental and Cognitive Psychology"}, {
            "id": "subfields/1407",
            "display_name": "Organizational Behavior and Human Resource Management"
        }, {"id": "subfields/2804", "display_name": "Cellular and Molecular Neuroscience"}, {
            "id": "subfields/3204",
            "display_name": "Developmental and Educational Psychology"
        }, {
            "id": "subfields/1100",
            "display_name": "General Agricultural and Biological Sciences"
        }, {"id": "subfields/2307", "display_name": "Health, Toxicology and Mutagenesis"}, {
            "id": "subfields/1404",
            "display_name": "Management Information Systems"
        }, {"id": "subfields/1910", "display_name": "Oceanography"}, {
            "id": "subfields/2504",
            "display_name": "Electronic, Optical and Magnetic Materials"
        }, {"id": "subfields/1306", "display_name": "Cancer Research"}, {
            "id": "subfields/3318",
            "display_name": "Gender Studies"
        }, {"id": "subfields/3109", "display_name": "Statistical and Nonlinear Physics"}, {
            "id": "subfields/2304",
            "display_name": "Environmental Chemistry"
        }, {"id": "subfields/2309", "display_name": "Nature and Landscape Conservation"}, {
            "id": "subfields/2507",
            "display_name": "Polymers and Plastics"
        }, {"id": "subfields/1604", "display_name": "Inorganic Chemistry"}, {
            "id": "subfields/1406",
            "display_name": "Marketing"
        }, {"id": "subfields/2305", "display_name": "Environmental Engineering"}, {
            "id": "subfields/1213",
            "display_name": "Visual Arts and Performing Arts"
        }, {"id": "subfields/2720", "display_name": "Hematology"}, {
            "id": "subfields/2604",
            "display_name": "Applied Mathematics"
        }, {"id": "subfields/2502", "display_name": "Biomaterials"}, {
            "id": "subfields/1606",
            "display_name": "Physical and Theoretical Chemistry"
        }, {"id": "subfields/1102", "display_name": "Agronomy and Crop Science"}, {
            "id": "subfields/3311",
            "display_name": "Safety Research"
        }, {"id": "subfields/2731", "display_name": "Ophthalmology"}, {
            "id": "subfields/1109",
            "display_name": "Insect Science"
        }, {"id": "subfields/2203", "display_name": "Automotive Engineering"}, {
            "id": "subfields/3104",
            "display_name": "Condensed Matter Physics"
        }, {"id": "subfields/2707", "display_name": "Complementary and alternative medicine"}, {
            "id": "subfields/1405",
            "display_name": "Management of Technology and Innovation"
        }, {"id": "subfields/3315", "display_name": "Communication"}, {
            "id": "subfields/1802",
            "display_name": "Information Systems and Management"
        }, {"id": "subfields/2213", "display_name": "Safety, Risk, Reliability and Quality"}, {
            "id": "subfields/3305",
            "display_name": "Geography, Planning and Development"
        }, {"id": "subfields/2608", "display_name": "Geometry and Topology"}, {
            "id": "subfields/2310",
            "display_name": "Pollution"
        }, {"id": "subfields/2214", "display_name": "Media Technology"}, {
            "id": "subfields/2708",
            "display_name": "Dermatology"
        }, {"id": "subfields/1111", "display_name": "Soil Science"}, {
            "id": "subfields/1103",
            "display_name": "Animal Science and Zoology"
        }, {"id": "subfields/2743", "display_name": "Reproductive Medicine"}, {
            "id": "subfields/1205",
            "display_name": "Classics"
        }, {"id": "subfields/2716", "display_name": "Genetics"}, {
            "id": "subfields/2610",
            "display_name": "Mathematical Physics"
        }, {"id": "subfields/2711", "display_name": "Emergency Medicine"}, {
            "id": "subfields/2613",
            "display_name": "Statistics and Probability"
        }, {"id": "subfields/1210", "display_name": "Music"}, {
            "id": "subfields/3108",
            "display_name": "Radiation"
        }, {"id": "subfields/3306", "display_name": "Health"}, {
            "id": "subfields/1711",
            "display_name": "Signal Processing"
        }, {"id": "subfields/2808", "display_name": "Neurology"}, {
            "id": "subfields/2311",
            "display_name": "Industrial and Manufacturing Engineering"
        }, {"id": "subfields/1209", "display_name": "Museology"}, {
            "id": "subfields/3300",
            "display_name": "General Social Sciences"
        }, {"id": "subfields/3004", "display_name": "Pharmacology"}, {
            "id": "subfields/2729",
            "display_name": "Obstetrics and Gynecology"
        }, {"id": "subfields/3604", "display_name": "Emergency Medical Services"}, {
            "id": "subfields/1602",
            "display_name": "Analytical Chemistry"
        }, {"id": "subfields/2721", "display_name": "Hepatology"}, {
            "id": "subfields/2732",
            "display_name": "Orthopedics and Sports Medicine"
        }, {"id": "subfields/2727", "display_name": "Nephrology"}, {
            "id": "subfields/3616",
            "display_name": "Speech and Hearing"
        }, {"id": "subfields/1804", "display_name": "Statistics, Probability and Uncertainty"}, {
            "id": "subfields/3313",
            "display_name": "Transportation"
        }, {"id": "subfields/1305", "display_name": "Biotechnology"}, {
            "id": "subfields/3612",
            "display_name": "Physical Therapy, Sports Therapy and Rehabilitation"
        }, {"id": "subfields/3303", "display_name": "Development"}, {
            "id": "subfields/3310",
            "display_name": "Linguistics and Language"
        }, {"id": "subfields/1206", "display_name": "Conservation"}, {
            "id": "subfields/1708",
            "display_name": "Hardware and Architecture"
        }, {"id": "subfields/1907", "display_name": "Geology"}, {
            "id": "subfields/1706",
            "display_name": "Computer Science Applications"
        }, {"id": "subfields/1104", "display_name": "Aquatic Science"}, {
            "id": "subfields/3504",
            "display_name": "Oral Surgery"
        }, {"id": "subfields/3404", "display_name": "Small Animals"}, {
            "id": "subfields/2405",
            "display_name": "Parasitology"
        }, {"id": "subfields/1911", "display_name": "Paleontology"}, {
            "id": "subfields/3003",
            "display_name": "Pharmaceutical Science"
        }, {"id": "subfields/3605", "display_name": "Health Information Management"}, {
            "id": "subfields/2742",
            "display_name": "Rehabilitation"
        }, {"id": "subfields/1904", "display_name": "Earth-Surface Processes"}, {
            "id": "subfields/2404",
            "display_name": "Microbiology"
        }, {"id": "subfields/3321", "display_name": "Public Administration"}, {
            "id": "subfields/2508",
            "display_name": "Surfaces, Coatings and Films"
        }, {"id": "subfields/2748", "display_name": "Urology"}, {
            "id": "subfields/1303",
            "display_name": "Biochemistry"
        }, {"id": "subfields/3609", "display_name": "Occupational Therapy"}, {
            "id": "subfields/1308",
            "display_name": "Clinical Biochemistry"
        }, {"id": "subfields/1107", "display_name": "Forestry"}, {
            "id": "subfields/2715",
            "display_name": "Gastroenterology"
        }, {"id": "subfields/3611", "display_name": "Pharmacy"}, {
            "id": "subfields/2703",
            "display_name": "Anesthesiology and Pain Medicine"
        }, {"id": "subfields/1906", "display_name": "Geochemistry and Petrology"}, {
            "id": "subfields/1709",
            "display_name": "Human-Computer Interaction"
        }, {"id": "subfields/1507", "display_name": "Fluid Flow and Transfer Processes"}, {
            "id": "subfields/2723",
            "display_name": "Immunology and Allergy"
        }, {"id": "subfields/3309", "display_name": "Library and Information Sciences"}, {
            "id": "subfields/1304",
            "display_name": "Biophysics"
        }, {"id": "subfields/3506", "display_name": "Periodontics"}, {
            "id": "subfields/2602",
            "display_name": "Algebra and Number Theory"
        }, {"id": "subfields/3614", "display_name": "Radiological and Ultrasound Technology"}, {
            "id": "subfields/1503",
            "display_name": "Catalysis"
        }, {"id": "subfields/2500", "display_name": "General Materials Science"}, {
            "id": "subfields/1310",
            "display_name": "Endocrinology"
        }, {"id": "subfields/2733", "display_name": "Otorhinolaryngology"}, {
            "id": "subfields/2807",
            "display_name": "Endocrine and Autonomic Systems"
        }, {"id": "subfields/2612", "display_name": "Numerical Analysis"}, {
            "id": "subfields/3202",
            "display_name": "Applied Psychology"
        }, {
            "id": "subfields/1704",
            "display_name": "Computer Graphics and Computer-Aided Design"
        }, {"id": "subfields/2702", "display_name": "Anatomy"}, {
            "id": "subfields/2503",
            "display_name": "Ceramics and Composites"
        }, {"id": "subfields/2611", "display_name": "Modeling and Simulation"}, {
            "id": "subfields/1712",
            "display_name": "Software"
        }, {
            "id": "subfields/2706",
            "display_name": "Critical Care and Intensive Care Medicine"
        }, {"id": "subfields/2406", "display_name": "Virology"}, {
            "id": "subfields/2717",
            "display_name": "Geriatrics and Gerontology"
        }, {"id": "subfields/3505", "display_name": "Orthodontics"}, {
            "id": "subfields/2704",
            "display_name": "Biochemistry"
        }, {"id": "subfields/1313", "display_name": "Molecular Medicine"}, {
            "id": "subfields/2302",
            "display_name": "Ecological Modeling"
        }, {"id": "subfields/1603", "display_name": "Electrochemistry"}, {
            "id": "subfields/2216",
            "display_name": "Architecture"
        }, {"id": "subfields/2809", "display_name": "Sensory Systems"}, {
            "id": "subfields/3105",
            "display_name": "Instrumentation"
        }, {"id": "subfields/2724", "display_name": "Internal Medicine"}, {
            "id": "subfields/1200",
            "display_name": "General Arts and Humanities"
        }, {"id": "subfields/1502", "display_name": "Bioengineering"}, {
            "id": "subfields/1314",
            "display_name": "Physiology"
        }, {"id": "subfields/2607", "display_name": "Discrete Mathematics and Combinatorics"}, {
            "id": "subfields/2910",
            "display_name": "Issues, ethics and legal aspects"
        }, {"id": "subfields/2614", "display_name": "Theoretical Computer Science"}, {
            "id": "subfields/2102",
            "display_name": "Energy Engineering and Power Technology"
        }, {"id": "subfields/3307", "display_name": "Human Factors and Ergonomics"}, {
            "id": "subfields/2806",
            "display_name": "Developmental Neuroscience"
        }, {"id": "subfields/3005", "display_name": "Toxicology"}, {
            "id": "subfields/3607",
            "display_name": "Medical Laboratory Technology"
        }, {"id": "subfields/3200", "display_name": "General Psychology"}, {
            "id": "subfields/1403",
            "display_name": "Business and International Management"
        }, {"id": "subfields/2747", "display_name": "Transplantation"}, {
            "id": "subfields/2802",
            "display_name": "Behavioral Neuroscience"
        }, {"id": "subfields/1410", "display_name": "Industrial relations"}, {
            "id": "subfields/3603",
            "display_name": "Complementary and Manual Therapy"
        }, {"id": "subfields/2100", "display_name": "General Energy"}, {
            "id": "subfields/2200",
            "display_name": "General Engineering"
        }, {
            "id": "subfields/3206",
            "display_name": "Neuropsychology and Physiological Psychology"
        }, {
            "id": "subfields/1409",
            "display_name": "Tourism, Leisure and Hospitality Management"
        }, {"id": "subfields/1508", "display_name": "Process Chemistry and Technology"}, {
            "id": "subfields/2402",
            "display_name": "Applied Microbiology and Biotechnology"
        }, {"id": "subfields/1912", "display_name": "Space and Planetary Science"}, {
            "id": "subfields/3319",
            "display_name": "Life-span and Life-course Studies"
        }, {"id": "subfields/1309", "display_name": "Developmental Biology"}, {
            "id": "subfields/3302",
            "display_name": "Archeology"
        }, {"id": "subfields/1302", "display_name": "Aging"}, {
            "id": "subfields/2911",
            "display_name": "Leadership and Management"
        }, {"id": "subfields/2803", "display_name": "Biological Psychiatry"}, {
            "id": "subfields/2506",
            "display_name": "Metals and Alloys"
        }, {"id": "subfields/2714", "display_name": "Family Practice"}, {
            "id": "subfields/1800",
            "display_name": "General Decision Sciences"
        }, {"id": "subfields/3402", "display_name": "Equine"}, {
            "id": "subfields/2103",
            "display_name": "Fuel Technology"
        }, {"id": "subfields/3500", "display_name": "General Dentistry"}, {
            "id": "subfields/1506",
            "display_name": "Filtration and Separation"
        }, {"id": "subfields/1504", "display_name": "Chemical Health and Safety"}, {
            "id": "subfields/2718",
            "display_name": "Health Informatics"
        }, {"id": "subfields/2726", "display_name": "Microbiology"}, {
            "id": "subfields/1315",
            "display_name": "Structural Biology"
        }, {"id": "subfields/3608", "display_name": "Medical Terminology"}, {
            "id": "subfields/3102",
            "display_name": "Acoustics and Ultrasonics"
        }, {"id": "subfields/1108", "display_name": "Horticulture"}, {
            "id": "subfields/2605",
            "display_name": "Computational Mathematics"
        }, {"id": "subfields/2922", "display_name": "Research and Theory"}, {
            "id": "subfields/2104",
            "display_name": "Nuclear Energy and Engineering"
        }, {"id": "subfields/3002", "display_name": "Drug Discovery"}]
    }, "topics": {
        "id": "topics",
        "icon": "mdi-tag-outline",
        "name": "topics",
        "nameSingular": "topic",
        "displayName": "topics",
        "displayNameSingular": "topics",
        "descr": "what works are about",
        "eg": "RNA sequencing",
        "placeholder": "Search topics",
        "filterName": "topics",
        "filterKey": "primary_topic.id",
        "descrFull": "Topics are the fourth level of description of the subject area of works. Each topic has a unique OpenAlex ID. Topics are above keywords but below domains, fields, and subfields in the hierarchy of research areas in OpenAlex.",
        "hintVerb": ":",
        "hasAutocomplete": true,
        "isNative": true,
        "idRegex": "(?i)(?:topics\\/)?(?:https:\\/\\/openalex\\.org\\/)?(t\\d+)",
        "showOnEntityPage": ["id", "display_name", "description", "siblings", "subfield", "field", "domain"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "topics",
                "entityId": "topics",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "icon": "mdi-tag-outline",
                "descr": "Unique identifier for the topic in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "topics",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": "display_name",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the topic."
            },
            "description": {
                "id": "description",
                "subjectEntity": "topics",
                "entityId": "topics",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": "description",
                "actions": ["column"],
                "icon": "mdi-tag-outline",
                "descr": "A description of the topic."
            },
            "siblings": {
                "id": "siblings",
                "isList": true,
                "subjectEntity": "topics",
                "entityId": "topics",
                "objectEntity": "topics",
                "displayName": "related topics (siblings)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "Other topics that are closely related to this topic."
            },
            "subfield": {
                "id": "subfield",
                "subjectEntity": "topics",
                "entityId": "subfields",
                "objectEntity": "subfields",
                "displayName": "subfield (parent)",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The subfield that this topic belongs to."
            },
            "field": {
                "id": "field",
                "subjectEntity": "topics",
                "entityId": "fields",
                "objectEntity": "fields",
                "displayName": "field",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The field that this topic belongs to."
            },
            "domain": {
                "id": "domain",
                "subjectEntity": "topics",
                "entityId": "domains",
                "objectEntity": "domains",
                "displayName": "domain",
                "type": "object",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The domain that this topic belongs to."
            },
            "count(works)": {
                "id": "count(works)",
                "subjectEntity": "topics",
                "entityId": "works",
                "objectEntity": null,
                "displayName": "works count",
                "type": "number",
                "redshiftDisplayColumn": "count(works)",
                "redshiftFilterColumn": null,
                "icon": "mdi-tag-outline",
                "descr": "The number of works that are tagged with this topic."
            }
        },
        "values": null
    }, "types": {
        "id": "types",
        "icon": "mdi-shape-outline",
        "name": "types",
        "nameSingular": "type",
        "displayName": "types",
        "displayNameSingular": "type",
        "descr": "Work type",
        "eg": "article",
        "placeholder": "Search work types",
        "filterName": "type",
        "filterKey": "type",
        "descrFull": "The type of work, such as an article, book, or dataset.",
        "hasAutocomplete": false,
        "isNative": false,
        "idRegex": "(?:https:\\/\\/openalex\\.org\\/types\\/|types\\/)([a-zA-Z\\-]+)",
        "showOnEntityPage": ["id", "display_name", "description", "crossref_types"],
        "showOnTablePage": ["display_name", "description"],
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "types",
                "entityId": "types",
                "objectEntity": null,
                "displayName": "Type ID",
                "isId": true,
                "type": "string",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [],
                "icon": "mdi-tag-outline",
                "descr": "The unique identifier for the work type in OpenAlex."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "types",
                "objectEntity": null,
                "displayName": "name",
                "type": "string",
                "redshiftDisplayColumn": "display_name",
                "redshiftFilterColumn": null,
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "icon": "mdi-account-outline",
                "descr": "The name of the work type."
            },
            "description": {
                "id": "description",
                "subjectEntity": "types",
                "entityId": "types",
                "objectEntity": null,
                "displayName": "description",
                "type": "string",
                "redshiftDisplayColumn": "description",
                "redshiftFilterColumn": null,
                "actions": ["column"],
                "icon": "mdi-shape-outline",
                "descr": "A description of the work type."
            },
            "crossref_types": {
                "id": "crossref_types",
                "isList": true,
                "subjectEntity": "types",
                "entityId": "types",
                "objectEntity": null,
                "displayName": "alternate names (Crossref)",
                "type": "array",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-shape-outline",
                "descr": "Alternate names for the work type from Crossref."
            }
        },
        "values": [{"id": "types/article", "display_name": "article"}, {
            "id": "types/book-chapter",
            "display_name": "book-chapter"
        }, {"id": "types/dataset", "display_name": "dataset"}, {
            "id": "types/preprint",
            "display_name": "preprint"
        }, {"id": "types/dissertation", "display_name": "dissertation"}, {
            "id": "types/book",
            "display_name": "book"
        }, {"id": "types/review", "display_name": "review"}, {
            "id": "types/paratext",
            "display_name": "paratext"
        }, {"id": "types/letter", "display_name": "letter"}, {
            "id": "types/other",
            "display_name": "other"
        }, {"id": "types/reference-entry", "display_name": "reference-entry"}, {
            "id": "types/report",
            "display_name": "report"
        }, {"id": "types/editorial", "display_name": "editorial"}, {
            "id": "types/peer-review",
            "display_name": "peer-review"
        }, {"id": "types/standard", "display_name": "standard"}, {
            "id": "types/erratum",
            "display_name": "erratum"
        }, {"id": "types/grant", "display_name": "grant"}, {
            "id": "types/supplementary-materials",
            "display_name": "supplementary-materials"
        }]
    }, "works": {
        "id": "works",
        "icon": "mdi-file-document-outline",
        "name": "works",
        "nameSingular": "work",
        "displayName": "works",
        "displayNameSingular": "work",
        "descr": "Scholarly papers, books, datasets, etc.",
        "eg": "On the Electrodynamics of Moving Bodies",
        "placeholder": "Search scholarly papers, books, and more",
        "filterName": "work",
        "filterKey": "ids.openalex",
        "descrFull": "Scholarly papers, books, datasets, and other works in OpenAlex.",
        "hintVerb": "by",
        "color": "blue",
        "hasAutocomplete": true,
        "isNative": true,
        "hasSerp": true,
        "highlightFilters": [{
            "key": "open_access.is_oa",
            "value": true,
            "displayName": "Open Access works"
        }, {
            "key": "institutions.is_global_south",
            "value": true,
            "displayName": "from the Global South"
        }, {"key": "type", "value": "dataset", "displayName": "datasets"}],
        "idRegex": "(?i)(?:works\\/)?(?:https:\\/\\/openalex\\.org\\/)?(w\\d+)",
        "showOnEntityPage": ["id", "display_name", "publication_year", "type", "abstract_inverted_index", "primary_location.source.id", "authorships.author.id", "authorships.institutions.id", "primary_topic.id", "primary_topic.subfield.id", "primary_topic.field.id", "primary_topic.domain.id", "sustainable_development_goals.id", "open_access.oa_status", "apc_paid.value_usd", "grants.funder", "grants.award_id"],
        "showOnTablePage": ["display_name", "publication_year", "type", "cited_by_count"],
        "groupByDefaults": ["publication_year", "open_access.is_oa", "primary_topic.id", "type"],
        "sortByDefault": "cited_by_count",
        "sortDirDefault": "desc",
        "columns": {
            "id": {
                "id": "id",
                "subjectEntity": "works",
                "entityId": "works",
                "objectEntity": null,
                "displayName": "OpenAlex ID",
                "isSingleWork": true,
                "isId": true,
                "type": "string",
                "category": "ids",
                "apiField": "id",
                "redshiftDisplayColumn": "id",
                "redshiftFilterColumn": "id",
                "actions": [""],
                "icon": "mdi-file-document-outline",
                "descr": "The unique identifier for the work in OpenAlex."
            },
            "doi": {
                "id": "doi",
                "subjectEntity": "works",
                "entityId": "works",
                "objectEntity": null,
                "displayName": "DOI",
                "isSingleWork": true,
                "isId": true,
                "type": "string",
                "category": "ids",
                "apiField": "doi",
                "redshiftDisplayColumn": "doi",
                "redshiftFilterColumn": "doi_lower",
                "actions": ["filter", "column"],
                "icon": "mdi-file-document-outline",
                "descr": "The Digital Object Identifier (DOI) of the work."
            },
            "primary_topic.id": {
                "id": "primary_topic.id",
                "subjectEntity": "works",
                "displayName": "topic",
                "entityId": "topics",
                "objectEntity": "topics",
                "type": "object",
                "category": "other",
                "apiField": "primary_topic.id",
                "redshiftDisplayColumn": "topic",
                "redshiftFilterColumn": "topic_id",
                "actions": ["filter", "column"],
                "actionsPopular": ["filter", "group_by"],
                "icon": "mdi-tag-outline",
                "descr": "The primary topic of the work."
            },
            "keywords.id": {
                "id": "keywords.id",
                "isList": true,
                "subjectEntity": "works",
                "displayName": "keyword",
                "entityId": "keywords",
                "objectEntity": "keywords",
                "type": "array",
                "category": "other",
                "apiField": "keywords.id",
                "redshiftDisplayColumn": "keywords",
                "redshiftFilterColumn": "keyword_id",
                "actions": ["filter", "column"],
                "actionsPopular": ["filter", "group_by"],
                "icon": "mdi-tag-outline",
                "descr": "Keywords associated with the work."
            },
            "primary_topic.subfield.id": {
                "id": "primary_topic.subfield.id",
                "subjectEntity": "works",
                "displayName": "subfield",
                "entityId": "subfields",
                "objectEntity": "subfields",
                "type": "object",
                "category": "other",
                "apiField": "primary_topic.subfield.id",
                "redshiftDisplayColumn": "subfield",
                "redshiftFilterColumn": "subfield_id",
                "actions": ["filter", "column"],
                "actionsPopular": [],
                "icon": "mdi-tag-outline",
                "descr": "The subfield of the primary topic of the work."
            },
            "primary_topic.field.id": {
                "id": "primary_topic.field.id",
                "subjectEntity": "works",
                "displayName": "field",
                "entityId": "fields",
                "objectEntity": "fields",
                "type": "object",
                "category": "other",
                "apiField": "primary_topic.field.id",
                "redshiftDisplayColumn": "field",
                "redshiftFilterColumn": "field_id",
                "actions": ["filter", "column"],
                "actionsPopular": [],
                "icon": "mdi-tag-outline",
                "descr": "The field of the primary topic of the work."
            },
            "primary_topic.domain.id": {
                "id": "primary_topic.domain.id",
                "subjectEntity": "works",
                "displayName": "domain",
                "entityId": "domains",
                "objectEntity": "domains",
                "type": "object",
                "category": "other",
                "apiField": "primary_topic.domain.id",
                "redshiftDisplayColumn": "domain",
                "redshiftFilterColumn": "domain_id",
                "actions": ["filter", "column"],
                "actionsPopular": [],
                "icon": "mdi-tag-outline",
                "descr": "The domain of the primary topic of the work."
            },
            "authorships.institutions.id": {
                "id": "authorships.institutions.id",
                "isList": true,
                "subjectEntity": "works",
                "displayName": "institutions",
                "entityId": "institutions",
                "objectEntity": "institutions",
                "type": "array",
                "category": "institution",
                "apiField": "authorships.institutions.id",
                "redshiftDisplayColumn": "institutions",
                "redshiftFilterColumn": "institution_id",
                "actions": ["filter", "return"],
                "actionsPopular": ["filter", "column"],
                "icon": "mdi-town-hall",
                "descr": "The OpenAlex institution ID of the institutions associated with the work."
            },
            "cited_by_count": {
                "id": "cited_by_count",
                "subjectEntity": "works",
                "displayName": "cited by count",
                "objectEntity": null,
                "type": "number",
                "apiField": "cited_by_count",
                "redshiftDisplayColumn": "cited_by_count",
                "redshiftFilterColumn": "cited_by_count",
                "actions": ["sort", "column", "filter"],
                "actionsPopular": ["sort"],
                "icon": "mdi-file-document-outline",
                "descr": "The number of times the work has been cited by other works."
            },
            "authorships.institutions.ror": {
                "id": "authorships.institutions.ror",
                "isList": true,
                "subjectEntity": "works",
                "entityId": "institutions",
                "objectEntity": null,
                "displayName": "ROR ID",
                "isId": true,
                "type": "array",
                "category": "ids",
                "apiField": "authorships.institutions.ror",
                "redshiftDisplayColumn": "ror_ids",
                "redshiftFilterColumn": "ror_id",
                "actions": [],
                "icon": "mdi-town-hall",
                "descr": "The Research Organization Registry (ROR) ID of the institutions associated with the work."
            },
            "authorships.author.id": {
                "id": "authorships.author.id",
                "isList": true,
                "subjectEntity": "works",
                "displayName": "authors",
                "entityId": "authors",
                "objectEntity": "authors",
                "type": "array",
                "category": "author",
                "apiField": "authorships.author.id",
                "redshiftDisplayColumn": "authors",
                "redshiftFilterColumn": "author_id",
                "actions": ["filter", "column"],
                "actionsPopular": ["filter", "group_by"],
                "icon": "mdi-account-outline",
                "descr": "The OpenAlex author ID of the authors associated with the work."
            },
            "authorships.author.orcid": {
                "id": "authorships.author.orcid",
                "isList": true,
                "subjectEntity": "works",
                "entityId": "authors",
                "objectEntity": null,
                "displayName": "ORCID",
                "isId": true,
                "type": "array",
                "category": "ids",
                "apiField": "authorships.author.orcid",
                "redshiftDisplayColumn": "orcid_ids",
                "redshiftFilterColumn": "orcid_id",
                "actions": [],
                "icon": "mdi-account-outline",
                "descr": "The Open Researcher and Contributor ID (ORCID) of the authors associated with the work."
            },
            "display_name": {
                "id": "display_name",
                "isColumnMandatory": true,
                "subjectEntity": "works",
                "displayName": "title",
                "objectEntity": null,
                "type": "string",
                "actions": ["sort", "column"],
                "actionsPopular": ["sort", "column"],
                "category": "other",
                "apiField": "display_name",
                "redshiftDisplayColumn": "display_name",
                "redshiftReturnColumn": "display_name",
                "icon": "mdi-file-document-outline",
                "descr": "The title of the work."
            },
            "open_access.is_oa": {
                "id": "open_access.is_oa",
                "subjectEntity": "works",
                "displayName": "open access",
                "objectEntity": null,
                "type": "boolean",
                "actions": ["filter", "column", "group_by"],
                "actionsPopular": ["filter", "column", "group_by"],
                "category": "open access",
                "apiField": "open_access.is_oa",
                "redshiftDisplayColumn": "is_oa",
                "redshiftFilterColumn": "is_oa",
                "icon": "mdi-lock-open-outline",
                "descr": "Whether the work is open access."
            },
            "open_access.oa_status": {
                "id": "open_access.oa_status",
                "subjectEntity": "works",
                "displayName": "oa status",
                "objectEntity": null,
                "type": "string",
                "actions": ["column", "filter"],
                "category": "open access",
                "apiField": "open_access.oa_status",
                "redshiftDisplayColumn": "oa_status",
                "redshiftFilterColumn": "oa_status",
                "icon": "mdi-lock-open-outline",
                "descr": "The open access status of the work."
            },
            "apc_paid.value_usd": {
                "id": "apc_paid.value_usd",
                "isCurrency": true,
                "subjectEntity": "works",
                "objectEntity": null,
                "displayName": "APC paid (est)",
                "type": "number",
                "sortByValue": true,
                "apiField": "apc_paid.value_usd",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-cash",
                "descr": "The Article Processing Charge (APC) paid in USD for the work."
            },
            "authorships.countries": {
                "id": "authorships.countries",
                "isList": true,
                "subjectEntity": "works",
                "entityId": "countries",
                "objectEntity": "countries",
                "displayName": "Country",
                "type": "array",
                "isCountry": true,
                "actions": ["filter", "column"],
                "actionsPopular": ["group_by"],
                "category": "institution",
                "apiField": "authorships.countries",
                "redshiftDisplayColumn": "authorships_countries",
                "redshiftFilterColumn": "country_id",
                "icon": "mdi-earth",
                "descr": "The countries of the institutions associated with the work."
            },
            "authorships.institutions.continent": {
                "id": "authorships.institutions.continent",
                "isList": true,
                "subjectEntity": "works",
                "entityId": "continents",
                "objectEntity": "continents",
                "displayName": "Continent",
                "isId": true,
                "type": "array",
                "actions": ["filter", "column"],
                "actionsPopular": [],
                "apiField": "authorships.institutions.continent",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "icon": "mdi-earth",
                "descr": "The continents of the institutions associated with the work."
            },
            "authorships.institutions.is_global_south": {
                "id": "institutions.is_global_south",
                "subjectEntity": "works",
                "displayName": "from Global South",
                "objectEntity": null,
                "type": "boolean",
                "actions": ["filter", "column"],
                "category": "institution",
                "apiField": "institutions.is_global_south",
                "redshiftDisplayColumn": "is_global_south",
                "redshiftReturnColumn": "is_global_south",
                "icon": "mdi-earth",
                "descr": "Whether the institutions associated with the work are in the Global South."
            },
            "authorships.institutions.type": {
                "id": "authorships.institutions.type",
                "isList": true,
                "subjectEntity": "works",
                "entityId": "institution-types",
                "objectEntity": "institution-types",
                "displayName": "institution type",
                "isId": true,
                "category": "institution",
                "apiField": "authorships.institutions.type",
                "redshiftDisplayColumn": "institution_types",
                "redshiftFilterColumn": "institution_type_id",
                "type": "object",
                "actions": ["filter"],
                "icon": "mdi-town-hall",
                "descr": "The institution types associated with the work."
            },
            "primary_location.source.id": {
                "id": "primary_location.source.id",
                "subjectEntity": "works",
                "displayName": "source",
                "entityId": "sources",
                "objectEntity": "sources",
                "type": "object",
                "category": "source",
                "apiField": "primary_location.source.id",
                "redshiftDisplayColumn": "primary_location",
                "redshiftFilterColumn": "journal_id",
                "actions": ["filter", "column"],
                "icon": "mdi-book-open-outline",
                "descr": "The primary source or location of the work."
            },
            "primary_location.source.issn": {
                "id": "primary_location.source.issn",
                "subjectEntity": "works",
                "entityId": "sources",
                "objectEntity": null,
                "displayName": "ISSN",
                "isId": true,
                "type": "string",
                "category": "ids",
                "apiField": "primary_location.source.issn",
                "redshiftDisplayColumn": "primary_source_issn",
                "redshiftFilterColumn": "primary_source_issn",
                "actions": [],
                "icon": "mdi-book-open-outline",
                "descr": "The International Standard Serial Number (ISSN) of the primary source of the work."
            },
            "primary_location.source.type": {
                "id": "primary_location.source.type",
                "subjectEntity": "works",
                "entityId": "source-types",
                "displayName": "source type",
                "objectEntity": "source-types",
                "isId": true,
                "type": "object",
                "category": "source",
                "apiField": "primary_location.source.type",
                "redshiftDisplayColumn": "primary_source_type",
                "redshiftFilterColumn": "primary_source_type",
                "actions": ["filter", "column"],
                "icon": "mdi-book-open-outline",
                "descr": "The source type of the primary source of the work."
            },
            "primary_location.source.is_in_doaj": {
                "id": "primary_location.source.is_in_doaj",
                "subjectEntity": "works",
                "displayName": "indexed by DOAJ",
                "objectEntity": null,
                "type": "boolean",
                "category": "source",
                "apiField": "primary_location.source.is_in_doaj",
                "redshiftDisplayColumn": "primary_source_is_in_doaj",
                "redshiftFilterColumn": "primary_source_is_in_doaj",
                "actions": ["filter", "column"],
                "icon": "mdi-book-open-outline",
                "descr": "Whether the primary source of the work is indexed by the Directory of Open Access Journals (DOAJ)."
            },
            "primary_location.source.is_oa": {
                "id": "primary_location.source.is_oa",
                "subjectEntity": "works",
                "displayName": "in OA source",
                "objectEntity": null,
                "type": "boolean",
                "category": "source",
                "apiField": "primary_location.source.is_oa",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-book-open-outline",
                "descr": "Whether the primary source of the work is an open access source."
            },
            "type": {
                "id": "type",
                "subjectEntity": "works",
                "entityId": "types",
                "displayName": "type",
                "objectEntity": "types",
                "isExternalId": true,
                "isId": true,
                "externalIdPrefix": "work-types",
                "type": "object",
                "category": "other",
                "apiField": "type",
                "redshiftDisplayColumn": "type_formatted",
                "redshiftFilterColumn": "type",
                "actions": ["filter", "column"],
                "actionsPopular": ["filter", "column"],
                "icon": "mdi-shape-outline",
                "descr": "The OpenAlex work type of the work"
            },
            "grants.funder": {
                "id": "grants.funder",
                "isList": true,
                "subjectEntity": "works",
                "displayName": "funder",
                "entityId": "funders",
                "objectEntity": "funders",
                "type": "array",
                "category": "other",
                "apiField": "grants.funder",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-cash-multiple",
                "descr": "The OpenAlex funder ID of the funders associated with the work."
            },
            "grants.award_id": {
                "id": "grants.award_id",
                "isList": true,
                "subjectEntity": "works",
                "displayName": "grant ID",
                "objectEntity": null,
                "type": "array",
                "category": "other",
                "apiField": "grants.award_id",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-cash-multiple",
                "descr": "The award ID of the grants associated with the work."
            },
            "publication_year": {
                "id": "publication_year",
                "isYear": true,
                "subjectEntity": "works",
                "displayName": "year",
                "objectEntity": null,
                "isDate": true,
                "type": "number",
                "sortByValue": true,
                "examples": ["1999", "1999-", "1999-2020"],
                "category": "other",
                "apiField": "publication_year",
                "redshiftDisplayColumn": "year",
                "redshiftFilterColumn": "year",
                "actions": ["filter", "sort", "column"],
                "actionsPopular": ["filter", "sort", "column", "group_by"],
                "icon": "mdi-calendar-range",
                "descr": "The publication year of the work."
            },
            "apc_sum": {
                "id": "apc_sum",
                "isCurrency": true,
                "subjectEntity": "works",
                "displayName": "APC sum",
                "objectEntity": null,
                "type": "number",
                "category": "other",
                "apiField": "apc_paid.value_usd",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "actionsPopular": ["group_by"],
                "icon": "mdi-cash",
                "descr": "The total Article Processing Charges (APC) paid in USD for the work."
            },
            "language": {
                "id": "language",
                "entityId": "languages",
                "subjectEntity": "works",
                "displayName": "language",
                "objectEntity": "languages",
                "isId": true,
                "type": "object",
                "displayNullAs": "Unknown",
                "category": "other",
                "apiField": "language",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": ["filter", "column"],
                "actionsPopular": [],
                "icon": "mdi-translate",
                "descr": "The language of the work."
            },
            "sustainable_development_goals.id": {
                "id": "sustainable_development_goals.id",
                "isList": true,
                "entityId": "sdgs",
                "objectEntity": "sdgs",
                "subjectEntity": "works",
                "displayName": "sdgs",
                "type": "array",
                "displayNullAs": "Unknown",
                "category": "other",
                "apiField": "sustainable_development_goals.id",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-sprout-outline",
                "descr": "The Sustainable Development Goals (SDGs) associated with the work."
            },
            "referenced_works": {
                "id": "referenced_works",
                "subjectEntity": "works",
                "entityId": "works",
                "isList": true,
                "isId": true,
                "objectEntity": null,
                "displayName": "cites",
                "type": "string",
                "category": "citation",
                "apiField": "referenced_works",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": null,
                "actions": [],
                "icon": "mdi-format-quote-close",
                "isDisplayedAsCount": true,
                "descr": "The works cited by the work."
            },
            "display_name.search": {
                "id": "display_name.search",
                "subjectEntity": "works",
                "displayName": "search display_name",
                "objectEntity": null,
                "type": "string",
                "category": "search",
                "apiField": "display_name",
                "redshiftDisplayColumn": null,
                "redshiftFilterColumn": "original_title",
                "actions": ["filter"],
                "icon": "mdi-file-document-outline",
                "descr": "Searches the title of the work."
            }
        },
        "values": null
    }
}