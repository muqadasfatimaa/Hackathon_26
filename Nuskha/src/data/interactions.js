/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Documented Medicine Interaction Reference Dataset & Lookup Engine
 *
 * Mandatory Medical Disclaimer & Rule:
 * If no interaction record is found:
 * "No interaction record was found in the available dataset. This does not mean the combination is safe."
 */

const interactionsData = [
  {
    id: "int-aspirin-warfarin",
    drugs: ["Aspirin", "Warfarin"],
    drugIds: ["aspirin-100", "warfarin-5"],
    severity: "Severe",
    title: "Severe Hemorrhage / Bleeding Risk",
    mechanism: "Concurrent administration of Aspirin (an irreversible platelet cyclooxygenase-1 inhibitor) and Warfarin (a vitamin K antagonist anticoagulant) produces synergistic antihemostatic effects, dramatically escalating the incidence of major gastrointestinal and intracerebral hemorrhages.",
    clinicalSummary: "Increased risk of major hemorrhage due to combined antiplatelet and anticoagulant effects. Strict clinical monitoring of INR and signs of bleeding is required when medically co-prescribed.",
    source: "US FDA Boxed Warning (Warfarin/Aspirin) / British National Formulary (BNF 86, Section 2.8.2) / American College of Chest Physicians (ACCP) Guidelines"
  },
  {
    id: "int-aspirin-ibuprofen",
    drugs: ["Aspirin", "Ibuprofen"],
    drugIds: ["aspirin-100", "ibuprofen-400"],
    severity: "Moderate",
    title: "Attenuation of Antiplatelet Protection & Gastric Mucosal Injury",
    mechanism: "Ibuprofen competitively and reversibly blocks the access of Aspirin to the platelet COX-1 Ser529 active site. When ingested prior to low-dose aspirin, ibuprofen diminishes aspirin's irreversible cardioprotective antiplatelet effect, while dual NSAID exposure increases gastroduodenal ulceration and gastrointestinal bleeding risks.",
    clinicalSummary: "Ibuprofen may interfere with the antiplatelet cardioprotection of low-dose aspirin and additive gastrointestinal mucosal toxicity increases ulceration risk.",
    source: "FDA Drug Safety Communication: Concomitant Use of Ibuprofen and Low Dose Aspirin (2006) / DailyMed Aspirin & Ibuprofen Prescribing Info"
  },
  {
    id: "int-paracetamol-warfarin",
    drugs: ["Paracetamol", "Warfarin"],
    drugIds: ["paracetamol-500", "warfarin-5"],
    severity: "Moderate",
    title: "Potentiation of Anticoagulant Effect (INR Elevation)",
    mechanism: "Sustained high-dose Paracetamol (Acetaminophen) inhibits vitamin K-dependent carboxylase and produces metabolites (such as NAPQI) that can alter warfarin metabolism, leading to unexpected prolongation of prothrombin time and elevated International Normalized Ratio (INR).",
    clinicalSummary: "Regular, high-dose paracetamol use over multiple consecutive days may elevate INR and increase bleeding vulnerability in patients receiving warfarin.",
    source: "British National Formulary (BNF 86, Appendix 1: Interactions) / Chest 2008 Evidence-Based Clinical Practice Guidelines"
  },
  {
    id: "int-atorvastatin-clarithromycin",
    drugs: ["Atorvastatin", "Clarithromycin"],
    drugIds: ["atorvastatin-20", "clarithromycin-500"],
    severity: "Severe",
    title: "Severe Myopathy / Rhabdomyolysis Risk (CYP3A4 Inhibition)",
    mechanism: "Clarithromycin is a potent mechanism-based inhibitor of Cytochrome P450 3A4 (CYP3A4) and organic anion-transporting polypeptide 1B1 (OATP1B1). Co-administration produces multi-fold elevations in atorvastatin systemic exposure, significantly predisposing to severe statin-induced skeletal muscle breakdown (rhabdomyolysis) and acute renal failure.",
    clinicalSummary: "Potent CYP3A4 inhibition drastically increases systemic atorvastatin exposure, posing a high risk of drug-induced myopathy, elevated serum creatine kinase, and rhabdomyolysis.",
    source: "FDA Drug Safety Communication (2012): Updated Statin Labels / DailyMed Lipitor & Biaxin Labeling / Lexicomp Clinical Drug Interactions"
  },
  {
    id: "int-lisinopril-potassium",
    drugs: ["Lisinopril", "Potassium Chloride"],
    drugIds: ["lisinopril-10", "potassium-chloride-600"],
    severity: "Severe",
    title: "Severe Hyperkalemia Risk",
    mechanism: "Lisinopril inhibits angiotensin-converting enzyme, decreasing angiotensin II and subsequent adrenal aldosterone synthesis. Aldosterone reduction leads to renal retention of potassium. Concurrent ingestion of potassium supplements or potassium-sparing agents frequently triggers life-threatening cardiac arrhythmias secondary to severe hyperkalemia.",
    clinicalSummary: "Concomitant potassium supplementation with an ACE inhibitor significantly increases serum potassium, potentially causing fatal cardiac conduction abnormalities.",
    source: "FDA Lisinopril Package Insert (Section 7: Drug Interactions) / BNF 86 Section 2.5.5.1 / KDIGO Clinical Practice Guideline"
  },
  {
    id: "int-clopidogrel-omeprazole",
    drugs: ["Clopidogrel", "Omeprazole"],
    drugIds: ["clopidogrel-75", "omeprazole-20"],
    severity: "Moderate",
    title: "Reduced Antiplatelet Efficacy (CYP2C19 Inhibition)",
    mechanism: "Clopidogrel is an inactive prodrug requiring bioactivation via hepatic CYP2C19. Omeprazole competitively inhibits CYP2C19, significantly reducing the circulating concentration of the active clopidogrel thiol metabolite and blunting ADP-induced platelet aggregation inhibition.",
    clinicalSummary: "Omeprazole reduces the antiplatelet effectiveness of clopidogrel, which may increase thrombotic cardiovascular event risk in susceptible patients.",
    source: "US FDA Drug Safety Communication (2009 & 2011) / European Medicines Agency (EMA) Warning on Clopidogrel and Omeprazole"
  },
  {
    id: "int-ciprofloxacin-antacid",
    drugs: ["Ciprofloxacin", "Aluminum Hydroxide and Magnesium Hydroxide"],
    drugIds: ["ciprofloxacin-500", "aluminum-magnesium-antacid"],
    severity: "Moderate",
    title: "Chelation and Impaired Fluoroquinolone Bioavailability",
    mechanism: "Divalent and trivalent cations (Al3+, Mg2+) form insoluble chelate complexes with the 4-keto and 3-carboxyl groups of ciprofloxacin in the gastrointestinal lumen, reducing fluoroquinolone oral absorption by up to 85% to 90%, precipitating antimicrobial therapeutic failure.",
    clinicalSummary: "Antacids containing magnesium or aluminum severely hinder ciprofloxacin absorption, risking antibiotic treatment failure.",
    source: "FDA Cipro Prescribing Information (Section 7) / British National Formulary (BNF 86, Section 5.1.12)"
  },
  {
    id: "int-sertraline-tramadol",
    drugs: ["Sertraline", "Tramadol"],
    drugIds: ["sertraline-50", "tramadol-50"],
    severity: "Severe",
    title: "Serotonin Syndrome and Increased Seizure Propensity",
    mechanism: "Sertraline inhibits 5-HT reuptake, while tramadol inhibits both 5-HT and norepinephrine reuptake while also stimulating 5-HT release. Simultaneous administration produces excessive synaptic serotonin accumulation, triggering neuromuscular hyperactivity, autonomic instability, and potentially fatal Serotonin Syndrome. Tramadol also lowers the convulsive threshold.",
    clinicalSummary: "Additive serotonergic activity poses a severe risk of Serotonin Syndrome (hyperthermia, clonus, autonomic crisis) and increases seizure risk.",
    source: "US FDA Drug Safety Alert: Serotonin Syndrome with Concomitant SSRI/Opioid Therapy / BNF 86 Section 4.7.2 & 4.3.3"
  },
  {
    id: "int-amoxicillin-methotrexate",
    drugs: ["Amoxicillin", "Methotrexate"],
    drugIds: ["amoxicillin-500", "methotrexate-2.5"],
    severity: "Moderate",
    title: "Decreased Methotrexate Renal Clearance & Hematologic Toxicity",
    mechanism: "Penicillins competitively inhibit renal tubular organic anion transport mechanisms responsible for methotrexate elimination, resulting in sustained elevated methotrexate serum concentrations and heightened bone marrow and gastrointestinal toxicity.",
    clinicalSummary: "Penicillin antibiotics can reduce renal excretion of methotrexate, increasing the likelihood of methotrexate-related toxicity.",
    source: "British National Formulary (BNF 86, Appendix 1: Methotrexate) / DailyMed Trexall Prescribing Information"
  }
];

const MANDATORY_NO_INTERACTION_MESSAGE =
  "No interaction record was found in the available dataset. This does not mean the combination is safe.";

function getAllInteractions() {
  return interactionsData;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    interactionsData,
    getAllInteractions,
    MANDATORY_NO_INTERACTION_MESSAGE
  };
}

if (typeof window !== "undefined") {
  window.NuskhaInteractions = {
    interactionsData,
    getAllInteractions,
    MANDATORY_NO_INTERACTION_MESSAGE
  };
}
