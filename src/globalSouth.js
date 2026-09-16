/**
 * ISO 3166-1 alpha-2 codes of the countries OpenAlex classes as Global South —
 * the `authorships.institutions.is_global_south` filter set
 * (openalex-elastic-api country_list.GLOBAL_SOUTH_COUNTRIES). The work JSON
 * carries no is_global_south flag on institutions, so the table column derives
 * it from country codes. The server mirrors this set in
 * openalex-users-api/formats/csv_manifest.py (GLOBAL_SOUTH_COUNTRY_CODES) so the
 * CSV export agrees (oxjob #1209).
 */
export const globalSouthCountryCodes = new Set((
    "AE AF AG AO AR BA BB BD BF BH BI BJ BN BO BR BS BT BW BZ CD CF CG CI CL " +
    "CM CN CO CR CU CV DJ DM DO DZ EC EG ER ET FJ FM GA GD GH GM GN GQ GT GW " +
    "GY HN HT ID IN IQ IR JM JO KE KH KI KM KN KP KW LA LB LC LK LR LS LY MA " +
    "MG MH ML MM MN MR MU MV MW MY MZ NA NE NG NI NP NR OM PA PE PG PH PK PS " +
    "PY QA RW SA SB SC SD SG SL SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN " +
    "TO TT TZ UG UY VC VE VN VU WS YE ZA ZM ZW"
).split(" "));
