import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";
import {getConfigs} from "@/oaxConfigs";
import {
    makeFilterBranch,
    makeFilterLeaf,
    baseQuery,
    convertFlatToRecursive,
    deleteNode, cleanFilters, deleteRootNodes, oqlToQueryWrapper, queryToOqlWrapper,
} from "@/components/Query/query";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";

Vue.use(Vuex)

const mockSearchResponse = {"id":"6NjWsGcG9EWhyVufBiEArF","query":{"get_rows":"works","filter_works":[{"column_id":"type","value":"types/article"}],"filter_aggs":[],"show_columns":["display_name","publication_year","type","cited_by_count"],"sort_by_column":"cited_by_count","sort_by_order":"desc"},"results":[{"id":"works/W1775749144","cells":[{"type":"string","value":"PROTEIN MEASUREMENT WITH THE FOLIN PHENOL REAGENT"},{"type":"number","value":1951},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":316586}]},{"id":"works/W2582743722","cells":[{"type":"string","value":"R: A language and environment for statistical computing."},{"type":"number","value":2014},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":267363}]},{"id":"works/W2100837269","cells":[{"type":"string","value":"Cleavage of Structural Proteins during the Assembly of the Head of Bacteriophage T4"},{"type":"number","value":1970},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":251656}]},{"id":"works/W2128635872","cells":[{"type":"string","value":"A Rapid and Sensitive Method for the Quantitation of Microgram Quantities of Protein Utilizing the Principle of Protein-Dye Binding"},{"type":"number","value":1976},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":224974}]},{"id":"works/W4293247451","cells":[{"type":"string","value":"A rapid and sensitive method for the quantitation of microgram quantities of protein utilizing the principle of protein-dye binding"},{"type":"number","value":1976},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":196671}]},{"id":"works/W1981368803","cells":[{"type":"string","value":"Generalized Gradient Approximation Made Simple"},{"type":"number","value":1996},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":167876}]},{"id":"works/W2194775991","cells":[{"type":"string","value":"Deep Residual Learning for Image Recognition"},{"type":"number","value":2016},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":157128}]},{"id":"works/W2107277218","cells":[{"type":"string","value":"Analysis of Relative Gene Expression Data Using Real-Time Quantitative PCR and the 2\u2212\u0394\u0394CT Method"},{"type":"number","value":2001},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":151250}]},{"id":"works/W2144634347","cells":[{"type":"string","value":"Molecular Cloning: A Laboratory Manual"},{"type":"number","value":2001},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":133542}]},{"id":"works/W1979290264","cells":[{"type":"string","value":"Using thematic analysis in psychology"},{"type":"number","value":2006},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":120077}]},{"id":"works/W2159011576","cells":[{"type":"string","value":"Diagnostic and Statistical Manual of Mental Disorders"},{"type":"number","value":2013},{"type":"object","value":{"id":"types/reference-entry","display_name":"reference-entry"}},{"type":"number","value":111239}]},{"id":"works/W2083222334","cells":[{"type":"string","value":"Efficient iterative schemes for<i>ab initio</i>total-energy calculations using a plane-wave basis set"},{"type":"number","value":1996},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":95154}]},{"id":"works/W2143981217","cells":[{"type":"string","value":"Density-functional thermochemistry. III. The role of exact exchange"},{"type":"number","value":1993},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":93154}]},{"id":"works/W2911964244","cells":[{"type":"string","value":""},{"type":"number","value":2001},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":91562}]},{"id":"works/W2023271753","cells":[{"type":"string","value":"Development of the Colle-Salvetti correlation-energy formula into a functional of the electron density"},{"type":"number","value":1988},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":90611}]},{"id":"works/W2964121744","cells":[{"type":"string","value":"Adam: A Method for Stochastic Optimization"},{"type":"number","value":2014},{"type":"object","value":{"id":"types/preprint","display_name":"preprint"}},{"type":"number","value":86069}]},{"id":"works/W2055043387","cells":[{"type":"string","value":"Basic local alignment search tool"},{"type":"number","value":1990},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":85499}]},{"id":"works/W2110065044","cells":[{"type":"string","value":"Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing"},{"type":"number","value":1995},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":85380}]},{"id":"works/W2131350133","cells":[{"type":"string","value":"A short history of<i>SHELX</i>"},{"type":"number","value":2007},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":83434}]},{"id":"works/W2071666535","cells":[{"type":"string","value":"Cutoff criteria for fit indexes in covariance structure analysis: Conventional criteria versus new alternatives"},{"type":"number","value":1999},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":82407}]},{"id":"works/W4247665917","cells":[{"type":"string","value":"Diagnostic and Statistical Manual of Mental Disorders"},{"type":"number","value":2013},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":81800}]},{"id":"works/W1847168837","cells":[{"type":"string","value":"\u201cMini-mental state\u201d"},{"type":"number","value":1975},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":81191}]},{"id":"works/W2314225431","cells":[{"type":"string","value":"Molecular cloning: A laboratory manual"},{"type":"number","value":1990},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":79675}]},{"id":"works/W1856219842","cells":[{"type":"string","value":"Standard methods: For the examination of water and waste water"},{"type":"number","value":1990},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":78049}]},{"id":"works/W1527311855","cells":[{"type":"string","value":"Case Study Research: Design and Methods"},{"type":"number","value":1984},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":77436}]},{"id":"works/W2156098321","cells":[{"type":"string","value":"Preferred reporting items for systematic reviews and meta-analyses: the PRISMA statement"},{"type":"number","value":2009},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":75912}]},{"id":"works/W2064675550","cells":[{"type":"string","value":"Long Short-Term Memory"},{"type":"number","value":1997},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":73188}]},{"id":"works/W1484864026","cells":[{"type":"string","value":"Using multivariate statistics"},{"type":"number","value":1983},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":72337}]},{"id":"works/W1970127494","cells":[{"type":"string","value":"Projector augmented-wave method"},{"type":"number","value":1994},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":71153}]},{"id":"works/W1995875735","cells":[{"type":"string","value":"A Mathematical Theory of Communication"},{"type":"number","value":1948},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":71131}]},{"id":"works/W4300870773","cells":[{"type":"string","value":"Statistical Power Analysis for the Behavioral Sciences"},{"type":"number","value":1989},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":70999}]},{"id":"works/W2158714788","cells":[{"type":"string","value":"Gapped BLAST and PSI-BLAST: a new generation of protein database search programs"},{"type":"number","value":1997},{"type":"object","value":{"id":"types/review","display_name":"review"}},{"type":"number","value":70568}]},{"id":"works/W2889646458","cells":[{"type":"string","value":"Global cancer statistics 2018: GLOBOCAN estimates of incidence and mortality worldwide for 36 cancers in 185 countries"},{"type":"number","value":2018},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":70228}]},{"id":"works/W3128646645","cells":[{"type":"string","value":"Global Cancer Statistics 2020: GLOBOCAN Estimates of Incidence and Mortality Worldwide for 36 Cancers in 185 Countries"},{"type":"number","value":2021},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":68770}]},{"id":"works/W2138270253","cells":[{"type":"string","value":"DNA sequencing with chain-terminating inhibitors"},{"type":"number","value":1977},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":68420}]},{"id":"works/W1971440513","cells":[{"type":"string","value":"The moderator-mediator variable distinction in social psychological research: Conceptual, strategic, and statistical considerations."},{"type":"number","value":1986},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":68058}]},{"id":"works/W2164777277","cells":[{"type":"string","value":"The Measurement of Observer Agreement for Categorical Data"},{"type":"number","value":1977},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":67248}]},{"id":"works/W1979544533","cells":[{"type":"string","value":"From ultrasoft pseudopotentials to the projector augmented-wave method"},{"type":"number","value":1999},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":66363}]},{"id":"works/W2107031757","cells":[{"type":"string","value":"Statistical power analysis for the behavioral sciences"},{"type":"number","value":1990},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":65887}]},{"id":"works/W2024556021","cells":[{"type":"string","value":"A Revised Medium for Rapid Growth and Bio Assays with Tobacco Tissue Cultures"},{"type":"number","value":1962},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":64525}]},{"id":"works/W2099697766","cells":[{"type":"string","value":"The theory of planned behavior"},{"type":"number","value":1991},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":64488}]},{"id":"works/W2179438025","cells":[{"type":"string","value":"Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2"},{"type":"number","value":2014},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":64255}]},{"id":"works/W2134812217","cells":[{"type":"string","value":"Single-Step Method of RNA Isolation by Acid Guanidinium Thiocyanate\u2013Phenol\u2013Chloroform Extraction"},{"type":"number","value":1987},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":64241}]},{"id":"works/W2163605009","cells":[{"type":"string","value":"ImageNet Classification with Deep Convolutional Neural Networks"},{"type":"number","value":2012},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":63422}]},{"id":"works/W2168526937","cells":[{"type":"string","value":"A SIMPLE METHOD FOR THE ISOLATION AND PURIFICATION OF TOTAL LIPIDES FROM ANIMAL TISSUES"},{"type":"number","value":1957},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":62459}]},{"id":"works/W2106882534","cells":[{"type":"string","value":"CLUSTAL W: improving the sensitivity of progressive multiple sequence alignment through sequence weighting, position-specific gap penalties and weight matrix choice"},{"type":"number","value":1994},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":62432}]},{"id":"works/W1951724000","cells":[{"type":"string","value":"Fitting Linear Mixed-Effects Models Using<b>lme4</b>"},{"type":"number","value":2015},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":61190}]},{"id":"works/W2919115771","cells":[{"type":"string","value":"Deep learning"},{"type":"number","value":2015},{"type":"object","value":{"id":"types/review","display_name":"review"}},{"type":"number","value":60505}]},{"id":"works/W4292811746","cells":[{"type":"string","value":"The moderator\u2013mediator variable distinction in social psychological research: Conceptual, strategic, and statistical considerations."},{"type":"number","value":1986},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":60191}]},{"id":"works/W2752617332","cells":[{"type":"string","value":"Theory of the firm: Managerial behavior, agency costs and ownership structure"},{"type":"number","value":1976},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":59927}]},{"id":"works/W2058122340","cells":[{"type":"string","value":"Electric Field Effect in Atomically Thin Carbon Films"},{"type":"number","value":2004},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":59289}]},{"id":"works/W2036113194","cells":[{"type":"string","value":"Special points for Brillouin-zone integrations"},{"type":"number","value":1976},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":58598}]},{"id":"works/W2007395042","cells":[{"type":"string","value":"Efficiency of ab-initio total energy calculations for metals and semiconductors using a plane-wave basis set"},{"type":"number","value":1996},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":58487}]},{"id":"works/W4211007335","cells":[{"type":"string","value":"Fuzzy sets"},{"type":"number","value":1965},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":58233}]},{"id":"works/W1901129140","cells":[{"type":"string","value":"U-Net: Convolutional Networks for Biomedical Image Segmentation"},{"type":"number","value":2015},{"type":"object","value":{"id":"types/book-chapter","display_name":"book-chapter"}},{"type":"number","value":57853}]},{"id":"works/W2106096361","cells":[{"type":"string","value":"Common method biases in behavioral research: A critical review of the literature and recommended remedies."},{"type":"number","value":2003},{"type":"object","value":{"id":"types/review","display_name":"review"}},{"type":"number","value":57804}]},{"id":"works/W2097706568","cells":[{"type":"string","value":"The neighbor-joining method: a new method for reconstructing phylogenetic trees."},{"type":"number","value":1987},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":57791}]},{"id":"works/W2132905138","cells":[{"type":"string","value":"CRC Handbook of Chemistry and Physics"},{"type":"number","value":2014},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":57747}]},{"id":"works/W2167590372","cells":[{"type":"string","value":"Revised effective ionic radii and systematic studies of interatomic distances in halides and chalcogenides"},{"type":"number","value":1976},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":57294}]},{"id":"works/W2298230951","cells":[{"type":"string","value":"Official Methods of Analysis of"},{"type":"number","value":1980},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":56940}]},{"id":"works/W2117692326","cells":[{"type":"string","value":"Hallmarks of Cancer: The Next Generation"},{"type":"number","value":2011},{"type":"object","value":{"id":"types/review","display_name":"review"}},{"type":"number","value":56418}]},{"id":"works/W2230728100","cells":[{"type":"string","value":"Self-Consistent Equations Including Exchange and Correlation Effects"},{"type":"number","value":1965},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":55480}]},{"id":"works/W2101108802","cells":[{"type":"string","value":"Electrophoretic transfer of proteins from polyacrylamide gels to nitrocellulose sheets: procedure and some applications."},{"type":"number","value":1979},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":54519}]},{"id":"works/W2106787323","cells":[{"type":"string","value":"Global cancer statistics"},{"type":"number","value":2011},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":54494}]},{"id":"works/W2163815564","cells":[{"type":"string","value":"The Rat Brain in Stereotaxic Coordinates"},{"type":"number","value":1982},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":54445}]},{"id":"works/W2101234009","cells":[{"type":"string","value":"Scikit-learn: Machine Learning in Python"},{"type":"number","value":2012},{"type":"object","value":{"id":"types/preprint","display_name":"preprint"}},{"type":"number","value":53345}]},{"id":"works/W2962835968","cells":[{"type":"string","value":"Very Deep Convolutional Networks for Large-Scale Image Recognition"},{"type":"number","value":2014},{"type":"object","value":{"id":"types/preprint","display_name":"preprint"}},{"type":"number","value":53065}]},{"id":"works/W2108234281","cells":[{"type":"string","value":"The Sequence Alignment/Map format and SAMtools"},{"type":"number","value":2009},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51750}]},{"id":"works/W2125435699","cells":[{"type":"string","value":"Measuring inconsistency in meta-analyses"},{"type":"number","value":2003},{"type":"object","value":{"id":"types/review","display_name":"review"}},{"type":"number","value":51622}]},{"id":"works/W2029667189","cells":[{"type":"string","value":"VMD: Visual molecular dynamics"},{"type":"number","value":1996},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51556}]},{"id":"works/W2167279371","cells":[{"type":"string","value":"Fiji: an open-source platform for biological-image analysis"},{"type":"number","value":2012},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51538}]},{"id":"works/W2114918609","cells":[{"type":"string","value":"Rapid colorimetric assay for cellular growth and survival: Application to proliferation and cytotoxicity assays"},{"type":"number","value":1983},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51481}]},{"id":"works/W1987258130","cells":[{"type":"string","value":"Evaluating Structural Equation Models with Unobservable Variables and Measurement Error"},{"type":"number","value":1981},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51457}]},{"id":"works/W4294215472","cells":[{"type":"string","value":"Preferred Reporting Items for Systematic Reviews and Meta-Analyses: The PRISMA Statement"},{"type":"number","value":2009},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":51169}]},{"id":"works/W2099540110","cells":[{"type":"string","value":"NIH Image to ImageJ: 25 years of image analysis"},{"type":"number","value":2012},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":50580}]},{"id":"works/W2151103935","cells":[{"type":"string","value":"Distinctive Image Features from Scale-Invariant Keypoints"},{"type":"number","value":2004},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":50331}]},{"id":"works/W2112778345","cells":[{"type":"string","value":"The CES-D Scale"},{"type":"number","value":1977},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":49219}]},{"id":"works/W2103441770","cells":[{"type":"string","value":"Fast and accurate short read alignment with Burrows\u2013Wheeler transform"},{"type":"number","value":2009},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":49218}]},{"id":"works/W2086957099","cells":[{"type":"string","value":"Density-functional exchange-energy approximation with correct asymptotic behavior"},{"type":"number","value":1988},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":48954}]},{"id":"works/W3023540311","cells":[{"type":"string","value":"Genetic algorithms in search, optimization, and machine learning"},{"type":"number","value":1989},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":48928}]},{"id":"works/W1791587663","cells":[{"type":"string","value":"Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology"},{"type":"number","value":1989},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":48663}]},{"id":"works/W2912565176","cells":[{"type":"string","value":"Fuzzy sets"},{"type":"number","value":1996},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":48663}]},{"id":"works/W2329395632","cells":[{"type":"string","value":"The Discovery of Grounded Theory: Strategies for Qualitative Research."},{"type":"number","value":1968},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":48586}]},{"id":"works/W2131271579","cells":[{"type":"string","value":"Trimmomatic: a flexible trimmer for Illumina sequence data"},{"type":"number","value":2014},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":48199}]},{"id":"works/W2120062331","cells":[{"type":"string","value":"Handbook of Mathematical Functions"},{"type":"number","value":1966},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":47979}]},{"id":"works/W1968834637","cells":[{"type":"string","value":"Colorimetric Method for Determination of Sugars and Related Substances"},{"type":"number","value":1956},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":47261}]},{"id":"works/W2135943618","cells":[{"type":"string","value":"Mind in Society: The Development of Higher Psychological Processes"},{"type":"number","value":1978},{"type":"object","value":{"id":"types/book","display_name":"book"}},{"type":"number","value":46976}]},{"id":"works/W2018289835","cells":[{"type":"string","value":"Short-Term Effects of Nose-Only Cigarette Smoke Exposure on Glutathione Redox Homeostasis, Cytochrome P450 1A1/2 and Respiratory Enzyme Activities in Mice Tissues"},{"type":"number","value":2013},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46710}]},{"id":"works/W2108598243","cells":[{"type":"string","value":"ImageNet: A large-scale hierarchical image database"},{"type":"number","value":2009},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46669}]},{"id":"works/W2030976617","cells":[{"type":"string","value":"Inhomogeneous Electron Gas"},{"type":"number","value":1964},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46615}]},{"id":"works/W2152311269","cells":[{"type":"string","value":"A RAPID METHOD OF TOTAL LIPID EXTRACTION AND PURIFICATION"},{"type":"number","value":1959},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46598}]},{"id":"works/W4235678817","cells":[{"type":"string","value":"Evaluating Structural Equation Models with Unobservable Variables and Measurement Error"},{"type":"number","value":1981},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46550}]},{"id":"works/W2087484885","cells":[{"type":"string","value":"G*Power 3: A flexible statistical power analysis program for the social, behavioral, and biomedical sciences"},{"type":"number","value":2007},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46297}]},{"id":"works/W2112796928","cells":[{"type":"string","value":"Gradient-based learning applied to document recognition"},{"type":"number","value":1998},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":46102}]},{"id":"works/W1979300931","cells":[{"type":"string","value":"Nonparametric Estimation from Incomplete Observations"},{"type":"number","value":1992},{"type":"object","value":{"id":"types/book-chapter","display_name":"book-chapter"}},{"type":"number","value":45936}]},{"id":"works/W2157823046","cells":[{"type":"string","value":"Bias in meta-analysis detected by a simple, graphical test"},{"type":"number","value":1997},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":45539}]},{"id":"works/W2142635246","cells":[{"type":"string","value":"A new look at the statistical model identification"},{"type":"number","value":1974},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":45441}]},{"id":"works/W3001118548","cells":[{"type":"string","value":"Clinical features of patients infected with 2019 novel coronavirus in Wuhan, China"},{"type":"number","value":2020},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":45015}]},{"id":"works/W2015795623","cells":[{"type":"string","value":"STATISTICAL METHODS FOR ASSESSING AGREEMENT BETWEEN TWO METHODS OF CLINICAL MEASUREMENT"},{"type":"number","value":1986},{"type":"object","value":{"id":"types/article","display_name":"article"}},{"type":"number","value":44943}]}],"results_header":[{"id":"display_name","isColumnMandatory":true,"subjectEntity":"works","displayName":"title","objectEntity":null,"type":"string","actions":["sort","column"],"actionsPopular":["sort","column"],"category":"other","apiField":"display_name","redshiftDisplayColumn":"display_name","redshiftReturnColumn":"display_name","icon":"mdi-file-document-outline","descr":"The title of the work."},{"id":"publication_year","isYear":true,"subjectEntity":"works","displayName":"year","objectEntity":null,"isDate":true,"type":"number","sortByValue":true,"examples":["1999","1999-","1999-2020"],"category":"other","apiField":"publication_year","redshiftDisplayColumn":"year","redshiftFilterColumn":"year","actions":["filter","sort","column"],"actionsPopular":["filter","sort","column","group_by"],"icon":"mdi-calendar-range","descr":"The publication year of the work."},{"id":"type","subjectEntity":"works","entityId":"types","displayName":"type","objectEntity":"types","isExternalId":true,"isId":true,"externalIdPrefix":"work-types","type":"object","category":"other","apiField":"type","redshiftDisplayColumn":"type_formatted","redshiftFilterColumn":"type","actions":["filter","column"],"actionsPopular":["filter","column"],"icon":"mdi-shape-outline","descr":"The OpenAlex work type of the work"},{"id":"cited_by_count","subjectEntity":"works","displayName":"cited by count","objectEntity":null,"type":"number","apiField":"cited_by_count","redshiftDisplayColumn":"cited_by_count","redshiftFilterColumn":"cited_by_count","actions":["sort","column","filter"],"actionsPopular":["sort"],"icon":"mdi-file-document-outline","descr":"The number of times the work has been cited by other works."}],"meta":{"count":258594339,"page":1,"per_page":100,"oql":null,"v1":null},"is_completed":true,"is_completed":true,"timestamps":{"started":"2024-09-05T07:07:11.921199+00:00","est_completed":"not implemented","completed":"2024-09-05T07:08:22.745238+00:00"}}





const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        query: {
            ...baseQuery(),
        },
        originalFilters: [],

        is_completed: null,
        results_header: [],
        results_body: [],
        results_meta: null,


    }
    return ret
}

const pushSafe = async function (route) {
    await router.push(route)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}
const getQueryFromOql = async function (oql) {
    const url = "https://api.openalex.org/query?q=" + oql
    const resp = await axios.get(url)
    console.log("got response back from justin", resp.data)
    const queryParts = resp.data.query.jsonQuery.json_query
    const ret = {
        ...baseQuery(),
        // oql: oql,
        ...queryParts,
    }
    return ret

}

export const search = {
    namespaced: true,
    state: stateDefaults(),
    mutations: {
        replaceState(state, newState) {
            Object.keys(newState).forEach(key => {
                state[key] = newState[key];
            });
        },
        toggleSortByDirection(state) {
            state.query.sort_by.direction = state.query.sort_by.direction === "asc" ? "desc" : "asc"
        },
    },
    actions: {

        // FILTER
        addFilter({state}, {filter, parentId}) {
            state.query.filters.push(filter)
            state.query.filters.find(f => f.id === parentId)?.children?.push(filter.id)
        },
        setFilter({state}, newFilter) {
            const filterToChange = state.query.filters.find(f => f.id === newFilter.id)
            Object.keys(newFilter).forEach(key => {
                Vue.set(filterToChange, key, newFilter[key])
            })
        },
        deleteFilter: function ({state, dispatch}, id) {
            console.log("deleteFilter", id)
            state.query.filters = deleteNode(state.query.filters, id)
        },

        setAllFilters({state}, newFilters) {
            state.query.filters = _.cloneDeep(newFilters)
        },
        clearAllFilters({state}) {
            state.query.filters = [makeFilterBranch("works")]
            state.query.filters = [makeFilterBranch("works")]
        },


        // SUMMARIZE
        setSummarize({state, dispatch}, columnId) {
            // no matter what, clear all the summarize_by filters
            dispatch("setAllFilters", state.query.filters.filter(f => f.subjectEntity === "works"))

            if (!columnId) {
                state.query.summarize_by = null
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.show_columns = getConfigs().works.showOnTablePage


            } else if (columnId === "all") {
                state.query.summarize_by = null
                state.query.sort_by.direction = null
                state.query.sort_by.column_id = null
                state.query.show_columns = []

            } else {
                state.query.summarize_by = columnId
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.show_columns = getConfigs()[columnId].showOnTablePage
                const filter = makeFilterBranch(columnId, true)
                dispatch("addFilter", {filter, parentId: undefined})
            }
        },


        // SORT
        setSortBy({state}, {column_id, direction}) {
            state.query.sort_by_column = column_id
            state.query.sort_by_order = direction
        },


        // RETURN COLUMNS
        addReturnColumn({state}, columnId) {
            state.query.show_columns.push(columnId)
        },
        deleteReturnColumn({state}, columnId) {
            state.query.show_columns = state.query.show_columns.filter((col) => col !== columnId)
        },


        // SET MANY THINGS AT ONCE
        setFromQueryObject({state}, query) {
            state.query = query
        },

        createSearchFromOql: async function ({state, dispatch}, oql) {
            console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql)
            dispatch("setFromQueryObject", query)
            dispatch("createSearch")
        },


        // CREATE AND READ SEARCH
        createSearch: async function ({state, getters}) {
            state.is_completed = false
            const url = "https://api.openalex.org/searches"
            const resp = await axios.post(url, {query: state.query})
            console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },


        getSearch: async function ({state, dispatch, commit, getters}, id) {
            state.id = id
            state.is_completed = false

            // get the search from the API
            const resp = await axios.get(getters.searchApiUrl)


            // set the state from the response
            state.is_completed = resp.data.is_completed
            state.oql = queryToOQL(resp.data.query)
            state.results_header = resp.data.results_header ?? []
            state.results_body = resp.data.results ?? []
            state.results_meta = resp.data.meta
            state.query = resp.data.query
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,

        query: (state) => state.query,
        queryColumns: (state, getters) => state.query.show_columns.map((col) => getters.querySubjectEntityConfig.columns[col]),
        querySubjectEntity: (state) => {
            if (!state.query.summarize_by) return "works"
            else if (state.query.summarize_by === "all") return null
            else return state.query.summarize_by

        },
        querySubjectEntityConfig: (state, getters) => {
            return getConfigs()[getters.querySubjectEntity]
        },
        isQuerySingleRow: (state) => state.query.summarize_by === "all",
        filterRoots: (state) => state.query.filters.filter(f => f.isRoot),
        worksFilters: (state) => state.query.filters.filter(f => f.subjectEntity === "works"),
        entityFilters: (state) => state.query.filters.filter(f => f.subjectEntity !== "works"),

        searchApiUrl: (state) => {
            return `https://api.openalex.org/searches/${state.id}`
        },


    },
}
