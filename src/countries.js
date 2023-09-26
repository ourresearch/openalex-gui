const openAlexCountries = [
    {
        id: "unknown",
        display_name: "unknown",
        works_count: 156081633
    },
    {
        id: "US",
        display_name: "United States of America",
        works_count: 24599403
    },
    {
        id: "CN",
        display_name: "China",
        works_count: 12195420
    },
    {
        id: "GB",
        display_name: "United Kingdom of Great Britain and Northern Ireland",
        works_count: 6448939
    },
    {
        id: "DE",
        display_name: "Germany",
        works_count: 5343707
    },
    {
        id: "JP",
        display_name: "Japan",
        works_count: 4797775
    },
    {
        id: "FR",
        display_name: "France",
        works_count: 4387506
    },
    {
        id: "CA",
        display_name: "Canada",
        works_count: 3175175
    },
    {
        id: "IN",
        display_name: "India",
        works_count: 3023394
    },
    {
        id: "IT",
        display_name: "Italy",
        works_count: 2784023
    },
    {
        id: "BR",
        display_name: "Brazil",
        works_count: 2544475
    },
    {
        id: "AU",
        display_name: "Australia",
        works_count: 2433567
    },
    {
        id: "ES",
        display_name: "Spain",
        works_count: 2318727
    },
    {
        id: "RU",
        display_name: "Russian Federation",
        works_count: 1903149
    },
    {
        id: "KR",
        display_name: "Korea, Republic of",
        works_count: 1669033
    },
    {
        id: "NL",
        display_name: "Netherlands",
        works_count: 1641042
    },
    {
        id: "ID",
        display_name: "Indonesia",
        works_count: 1597451
    },
    {
        id: "PL",
        display_name: "Poland",
        works_count: 1389156
    },
    {
        id: "CH",
        display_name: "Switzerland",
        works_count: 1198116
    },
    {
        id: "SE",
        display_name: "Sweden",
        works_count: 1111755
    },
    {
        id: "TR",
        display_name: "Turkey",
        works_count: 1014869
    },
    {
        id: "BE",
        display_name: "Belgium",
        works_count: 1012708
    },
    {
        id: "IR",
        display_name: "Iran, Islamic Republic of",
        works_count: 993380
    },
    {
        id: "TW",
        display_name: "Taiwan, Province of China",
        works_count: 934172
    },
    {
        id: "MX",
        display_name: "Mexico",
        works_count: 753250
    },
    {
        id: "DK",
        display_name: "Denmark",
        works_count: 705256
    },
    {
        id: "IL",
        display_name: "Israel",
        works_count: 665867
    },
    {
        id: "AT",
        display_name: "Austria",
        works_count: 655642
    },
    {
        id: "NO",
        display_name: "Norway",
        works_count: 615801
    },
    {
        id: "PT",
        display_name: "Portugal",
        works_count: 544777
    },
    {
        id: "ZA",
        display_name: "South Africa",
        works_count: 538176
    },
    {
        id: "FI",
        display_name: "Finland",
        works_count: 531072
    },
    {
        id: "CZ",
        display_name: "Czechia",
        works_count: 523823
    },
    {
        id: "MY",
        display_name: "Malaysia",
        works_count: 492281
    },
    {
        id: "EG",
        display_name: "Egypt",
        works_count: 488756
    },
    {
        id: "GR",
        display_name: "Greece",
        works_count: 476538
    },
    {
        id: "SG",
        display_name: "Singapore",
        works_count: 453806
    },
    {
        id: "AR",
        display_name: "Argentina",
        works_count: 423870
    },
    {
        id: "SA",
        display_name: "Saudi Arabia",
        works_count: 393427
    },
    {
        id: "NZ",
        display_name: "New Zealand",
        works_count: 387626
    },
    {
        id: "CO",
        display_name: "Colombia",
        works_count: 364175
    },
    {
        id: "UA",
        display_name: "Ukraine",
        works_count: 359566
    },
    {
        id: "IE",
        display_name: "Ireland",
        works_count: 353273
    },
    {
        id: "PK",
        display_name: "Pakistan",
        works_count: 343430
    },
    {
        id: "HU",
        display_name: "Hungary",
        works_count: 338362
    },
    {
        id: "CL",
        display_name: "Chile",
        works_count: 330839
    },
    {
        id: "TH",
        display_name: "Thailand",
        works_count: 294199
    },
    {
        id: "RO",
        display_name: "Romania",
        works_count: 282850
    },
    {
        id: "NG",
        display_name: "Nigeria",
        works_count: 264867
    },
    {
        id: "HR",
        display_name: "Croatia",
        works_count: 197892
    },
    {
        id: "SK",
        display_name: "Slovakia",
        works_count: 185737
    },
    {
        id: "BD",
        display_name: "Bangladesh",
        works_count: 159742
    },
    {
        id: "RS",
        display_name: "Serbia",
        works_count: 152711
    },
    {
        id: "MA",
        display_name: "Morocco",
        works_count: 151969
    },
    {
        id: "VN",
        display_name: "Viet Nam",
        works_count: 150545
    },
    {
        id: "SI",
        display_name: "Slovenia",
        works_count: 148633
    },
    {
        id: "BG",
        display_name: "Bulgaria",
        works_count: 141981
    },
    {
        id: "TN",
        display_name: "Tunisia",
        works_count: 141920
    },
    {
        id: "DZ",
        display_name: "Algeria",
        works_count: 137601
    },
    {
        id: "PE",
        display_name: "Peru",
        works_count: 136630
    },
    {
        id: "CU",
        display_name: "Cuba",
        works_count: 119251
    },
    {
        id: "IQ",
        display_name: "Iraq",
        works_count: 113753
    },
    {
        id: "AE",
        display_name: "United Arab Emirates",
        works_count: 107228
    },
    {
        id: "EC",
        display_name: "Ecuador",
        works_count: 96624
    },
    {
        id: "PH",
        display_name: "Philippines",
        works_count: 94596
    },
    {
        id: "VE",
        display_name: "Venezuela, Bolivarian Republic of",
        works_count: 90356
    },
    {
        id: "KE",
        display_name: "Kenya",
        works_count: 85544
    },
    {
        id: "LT",
        display_name: "Lithuania",
        works_count: 78811
    },
    {
        id: "ET",
        display_name: "Ethiopia",
        works_count: 77062
    },
    {
        id: "JO",
        display_name: "Jordan",
        works_count: 75010
    },
    {
        id: "QA",
        display_name: "Qatar",
        works_count: 71321
    },
    {
        id: "BY",
        display_name: "Belarus",
        works_count: 67918
    },
    {
        id: "GH",
        display_name: "Ghana",
        works_count: 65391
    },
    {
        id: "EE",
        display_name: "Estonia",
        works_count: 64792
    },
    {
        id: "CR",
        display_name: "Costa Rica",
        works_count: 63704
    },
    {
        id: "NP",
        display_name: "Nepal",
        works_count: 63024
    },
    {
        id: "LK",
        display_name: "Sri Lanka",
        works_count: 61248
    },
    {
        id: "LB",
        display_name: "Lebanon",
        works_count: 61104
    },
    {
        id: "LU",
        display_name: "Luxembourg",
        works_count: 59408
    },
    {
        id: "CY",
        display_name: "Cyprus",
        works_count: 57843
    },
    {
        id: "GE",
        display_name: "Georgia",
        works_count: 57696
    },
    {
        id: "KZ",
        display_name: "Kazakhstan",
        works_count: 55901
    },
    {
        id: "LV",
        display_name: "Latvia",
        works_count: 55293
    },
    {
        id: "UZ",
        display_name: "Uzbekistan",
        works_count: 50430
    },
    {
        id: "UY",
        display_name: "Uruguay",
        works_count: 45777
    },
    {
        id: "TZ",
        display_name: "Tanzania, United Republic of",
        works_count: 45417
    },
    {
        id: "KW",
        display_name: "Kuwait",
        works_count: 41141
    },
    {
        id: "UG",
        display_name: "Uganda",
        works_count: 39424
    },
    {
        id: "CM",
        display_name: "Cameroon",
        works_count: 37698
    },
    {
        id: "IS",
        display_name: "Iceland",
        works_count: 34178
    },
    {
        id: "OM",
        display_name: "Oman",
        works_count: 34107
    },
    {
        id: "AZ",
        display_name: "Azerbaijan",
        works_count: 32113
    },
    {
        id: "TJ",
        display_name: "Tajikistan",
        works_count: 31682
    },
    {
        id: "BA",
        display_name: "Bosnia and Herzegovina",
        works_count: 28560
    },
    {
        id: "AM",
        display_name: "Armenia",
        works_count: 27849
    },
    {
        id: "MK",
        display_name: "North Macedonia",
        works_count: 26356
    },
    {
        id: "BO",
        display_name: "Bolivia, Plurinational State of",
        works_count: 25874
    },
    {
        id: "PA",
        display_name: "Panama",
        works_count: 23973
    },
    {
        id: "ZW",
        display_name: "Zimbabwe",
        works_count: 23327
    },
    {
        id: "SD",
        display_name: "Sudan",
        works_count: 23164
    },
    {
        id: "MN",
        display_name: "Mongolia",
        works_count: 18850
    },
    {
        id: "SN",
        display_name: "Senegal",
        works_count: 17400
    },
    {
        id: "MD",
        display_name: "Moldova, Republic of",
        works_count: 17377
    },
    {
        id: "YE",
        display_name: "Yemen",
        works_count: 17217
    },
    {
        id: "MT",
        display_name: "Malta",
        works_count: 17192
    },
    {
        id: "CI",
        display_name: "Côte d'Ivoire",
        works_count: 16849
    },
    {
        id: "ZM",
        display_name: "Zambia",
        works_count: 16308
    },
    {
        id: "PS",
        display_name: "Palestine, State of",
        works_count: 15994
    },
    {
        id: "KH",
        display_name: "Cambodia",
        works_count: 15409
    },
    {
        id: "PY",
        display_name: "Paraguay",
        works_count: 15205
    },
    {
        id: "BH",
        display_name: "Bahrain",
        works_count: 13819
    },
    {
        id: "MW",
        display_name: "Malawi",
        works_count: 13654
    },
    {
        id: "MZ",
        display_name: "Mozambique",
        works_count: 13221
    },
    {
        id: "MM",
        display_name: "Myanmar",
        works_count: 13196
    },
    {
        id: "GT",
        display_name: "Guatemala",
        works_count: 13020
    },
    {
        id: "BW",
        display_name: "Botswana",
        works_count: 12919
    },
    {
        id: "VG",
        display_name: "Virgin Islands, British",
        works_count: 12834
    },
    {
        id: "BJ",
        display_name: "Benin",
        works_count: 12490
    },
    {
        id: "BF",
        display_name: "Burkina Faso",
        works_count: 12425
    },
    {
        id: "SY",
        display_name: "Syrian Arab Republic",
        works_count: 12223
    },
    {
        id: "AL",
        display_name: "Albania",
        works_count: 12144
    },
    {
        id: "JM",
        display_name: "Jamaica",
        works_count: 11991
    },
    {
        id: "NE",
        display_name: "Niger",
        works_count: 11884
    },
    {
        id: "BI",
        display_name: "Burundi",
        works_count: 11011
    },
    {
        id: "LY",
        display_name: "Libya",
        works_count: 10988
    },
    {
        id: "ML",
        display_name: "Mali",
        works_count: 10766
    },
    {
        id: "BN",
        display_name: "Brunei Darussalam",
        works_count: 10049
    },
    {
        id: "CD",
        display_name: "Congo, Democratic Republic of the",
        works_count: 9738
    },
    {
        id: "TT",
        display_name: "Trinidad and Tobago",
        works_count: 9447
    },
    {
        id: "RE",
        display_name: "Réunion",
        works_count: 8601
    },
    {
        id: "RW",
        display_name: "Rwanda",
        works_count: 8283
    },
    {
        id: "HN",
        display_name: "Honduras",
        works_count: 8087
    },
    {
        id: "SS",
        display_name: "South Sudan",
        works_count: 8081
    },
    {
        id: "NI",
        display_name: "Nicaragua",
        works_count: 7919
    },
    {
        id: "ME",
        display_name: "Montenegro",
        works_count: 7832
    },
    {
        id: "KG",
        display_name: "Kyrgyzstan",
        works_count: 7621
    },
    {
        id: "XK",
        display_name: "Kosovo",
        works_count: 7610
    },
    {
        id: "MG",
        display_name: "Madagascar",
        works_count: 7344
    },
    {
        id: "SV",
        display_name: "El Salvador",
        works_count: 7305
    },
    {
        id: "DO",
        display_name: "Dominican Republic",
        works_count: 7194
    },
    {
        id: "FJ",
        display_name: "Fiji",
        works_count: 6939
    },
    {
        id: "NA",
        display_name: "Namibia",
        works_count: 6589
    },
    {
        id: "PG",
        display_name: "Papua New Guinea",
        works_count: 6172
    },
    {
        id: "MU",
        display_name: "Mauritius",
        works_count: 6149
    },
    {
        id: "CG",
        display_name: "Congo",
        works_count: 5412
    },
    {
        id: "GM",
        display_name: "Gambia",
        works_count: 4882
    },
    {
        id: "GP",
        display_name: "Guadeloupe",
        works_count: 4740
    },
    {
        id: "TG",
        display_name: "Togo",
        works_count: 4511
    },
    {
        id: "GA",
        display_name: "Gabon",
        works_count: 4402
    },
    {
        id: "AF",
        display_name: "Afghanistan",
        works_count: 4364
    },
    {
        id: "GD",
        display_name: "Grenada",
        works_count: 4090
    },
    {
        id: "AO",
        display_name: "Angola",
        works_count: 3760
    },
    {
        id: "MC",
        display_name: "Monaco",
        works_count: 3718
    },
    {
        id: "BB",
        display_name: "Barbados",
        works_count: 3654
    },
    {
        id: "LA",
        display_name: "Lao People's Democratic Republic",
        works_count: 3643
    },
    {
        id: "NC",
        display_name: "New Caledonia",
        works_count: 3492
    },
    {
        id: "LI",
        display_name: "Liechtenstein",
        works_count: 3354
    },
    {
        id: "PF",
        display_name: "French Polynesia",
        works_count: 3125
    },
    {
        id: "SL",
        display_name: "Sierra Leone",
        works_count: 2849
    },
    {
        id: "MQ",
        display_name: "Martinique",
        works_count: 2826
    },
    {
        id: "GF",
        display_name: "French Guiana",
        works_count: 2567
    },
    {
        id: "ST",
        display_name: "Sao Tome and Principe",
        works_count: 2340
    },
    {
        id: "GL",
        display_name: "Greenland",
        works_count: 2284
    },
    {
        id: "SZ",
        display_name: "Eswatini",
        works_count: 2084
    },
    {
        id: "BT",
        display_name: "Bhutan",
        works_count: 1980
    },
    {
        id: "KN",
        display_name: "Saint Kitts and Nevis",
        works_count: 1818
    },
    {
        id: "GN",
        display_name: "Guinea",
        works_count: 1754
    },
    {
        id: "BS",
        display_name: "Bahamas",
        works_count: 1747
    },
    {
        id: "TM",
        display_name: "Turkmenistan",
        works_count: 1708
    },
    {
        id: "CW",
        display_name: "Curaçao",
        works_count: 1563
    },
    {
        id: "FO",
        display_name: "Faroe Islands",
        works_count: 1558
    },
    {
        id: "LS",
        display_name: "Lesotho",
        works_count: 1554
    },
    {
        id: "MV",
        display_name: "Maldives",
        works_count: 1530
    },
    {
        id: "GW",
        display_name: "Guinea-Bissau",
        works_count: 1424
    },
    {
        id: "AG",
        display_name: "Antigua and Barbuda",
        works_count: 1293
    },
    {
        id: "LR",
        display_name: "Liberia",
        works_count: 1247
    },
    {
        id: "BM",
        display_name: "Bermuda",
        works_count: 1239
    },
    {
        id: "HT",
        display_name: "Haiti",
        works_count: 1169
    },
    {
        id: "TD",
        display_name: "Chad",
        works_count: 1167
    },
    {
        id: "GY",
        display_name: "Guyana",
        works_count: 1121
    },
    {
        id: "SO",
        display_name: "Somalia",
        works_count: 1095
    },
    {
        id: "CF",
        display_name: "Central African Republic",
        works_count: 1091
    },
    {
        id: "MR",
        display_name: "Mauritania",
        works_count: 1087
    },
    {
        id: "KP",
        display_name: "Korea, Democratic People's Republic of",
        works_count: 1063
    },
    {
        id: "SR",
        display_name: "Suriname",
        works_count: 995
    },
    {
        id: "BZ",
        display_name: "Belize",
        works_count: 993
    },
    {
        id: "GI",
        display_name: "Gibraltar",
        works_count: 987
    },
    {
        id: "SC",
        display_name: "Seychelles",
        works_count: 974
    },
    {
        id: "ER",
        display_name: "Eritrea",
        works_count: 893
    },
    {
        id: "CV",
        display_name: "Cabo Verde",
        works_count: 846
    },
    {
        id: "IM",
        display_name: "Isle of Man",
        works_count: 845
    },
    {
        id: "KY",
        display_name: "Cayman Islands",
        works_count: 748
    },
    {
        id: "SM",
        display_name: "San Marino",
        works_count: 700
    },
    {
        id: "VU",
        display_name: "Vanuatu",
        works_count: 691
    },
    {
        id: "WS",
        display_name: "Samoa",
        works_count: 682
    },
    {
        id: "TL",
        display_name: "Timor-Leste",
        works_count: 669
    },
    {
        id: "VA",
        display_name: "Holy See",
        works_count: 563
    },
    {
        id: "PW",
        display_name: "Palau",
        works_count: 547
    },
    {
        id: "FK",
        display_name: "Falkland Islands (Malvinas)",
        works_count: 541
    },
    {
        id: "JE",
        display_name: "Jersey",
        works_count: 530
    }
]

export {openAlexCountries}