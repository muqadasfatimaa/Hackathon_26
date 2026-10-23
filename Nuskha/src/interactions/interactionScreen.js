/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Drug-Drug Interaction Screening Engine
 *
 * Implements strict, documented clinical screening:
 * - Screens pairwise combinations of identified medicines
 * - Labels uncertainty if medicines originated from fuzzy OCR matches
 * - Mandates exact notice when no documented record is found:
 *   "No interaction record was found in the available dataset. This does not mean the combination is safe."
 * - Strictly avoids diagnostic, therapeutic, or dosage modification advice.
 */

let defaultInteractions;
let MANDATORY_MSG;

if (typeof require !== "undefined") {
  const interactionsModule = require("../data/interactions");
  defaultInteractions = interactionsModule.getAllInteractions();
  MANDATORY_MSG = interactionsModule.MANDATORY_NO_INTERACTION_MESSAGE;
} else {
  defaultInteractions = window.NuskhaInteractions.getAllInteractions();
  MANDATORY_MSG = window.NuskhaInteractions.MANDATORY_NO_INTERACTION_MESSAGE;
}

/**
 * Screens a list of matched medicines for documented interactions
 *
 * @param {Array<Object>} matchedMedicines - List of matched medicine objects (or match result items)
 * @param {Array<Object>} [interactionsDataset] - Optional custom interaction dataset
 * @returns {Object} Screening results
 */
function screenInteractions(matchedMedicines, interactionsDataset = defaultInteractions) {
  if (!Array.isArray(matchedMedicines) || matchedMedicines.length < 2) {
    return {
      screenedCount: Array.isArray(matchedMedicines) ? matchedMedicines.length : 0,
      pairCount: 0,
      detectedInteractions: [],
      hasInteractions: false,
      safetyNotice: matchedMedicines && matchedMedicines.length === 1
        ? "Only a single medicine was identified. Multi-drug interaction screening requires at least two identified agents."
        : "No medicines identified for interaction screening.",
      datasetLimitation: getInteractionLimitationNotice(interactionsDataset.length),
      noInteractionFoundMessage: MANDATORY_MSG
    };
  }

  // Extract clean medicine representation
  const cleanMeds = matchedMedicines.map(m => {
    const medObj = m.medicine || m;
    return {
      id: medObj.id,
      brandName: medObj.brandName,
      genericName: medObj.genericName,
      activeIngredient: medObj.activeIngredient,
      isFuzzy: m.matchType === "Possible Match" || m.matchType === "Likely Match" || (m.confidenceScore && m.confidenceScore < 1.0),
      confidencePercent: m.confidencePercent || 100,
      originalToken: m.originalToken || null
    };
  });

  const detectedInteractions = [];
  const checkedPairs = [];
  let pairCount = 0;

  // Screen all unique pairs (i, j where i < j)
  for (let i = 0; i < cleanMeds.length; i++) {
    for (let j = i + 1; j < cleanMeds.length; j++) {
      pairCount++;
      const medA = cleanMeds[i];
      const medB = cleanMeds[j];
      const pairKey = `${medA.id}__${medB.id}`;

      const interaction = findInteractionRecord(medA, medB, interactionsDataset);

      if (interaction) {
        const isUncertain = medA.isFuzzy || medB.isFuzzy;
        const uncertaintyDetails = [];
        if (medA.isFuzzy) {
          uncertaintyDetails.push(`${medA.brandName} (Fuzzy match from OCR token "${medA.originalToken}", ${medA.confidencePercent}% confidence)`);
        }
        if (medB.isFuzzy) {
          uncertaintyDetails.push(`${medB.brandName} (Fuzzy match from OCR token "${medB.originalToken}", ${medB.confidencePercent}% confidence)`);
        }

        detectedInteractions.push({
          id: interaction.id,
          drugA: medA.brandName,
          drugB: medB.brandName,
          genericA: medA.genericName,
          genericB: medB.genericName,
          severity: interaction.severity,
          title: interaction.title,
          mechanism: interaction.mechanism,
          clinicalSummary: interaction.clinicalSummary,
          source: interaction.source,
          isUncertain: isUncertain,
          uncertaintyExplanation: isUncertain
            ? `Medicine identification is uncertain: ${uncertaintyDetails.join("; ")}. Please verify original prescription text.`
            : null
        });
      } else {
        checkedPairs.push({
          drugA: medA.brandName,
          drugB: medB.brandName,
          status: "No documented interaction record in dataset",
          message: MANDATORY_MSG
        });
      }
    }
  }

  return {
    screenedCount: cleanMeds.length,
    pairCount,
    hasInteractions: detectedInteractions.length > 0,
    detectedInteractions,
    unrecordedPairs: checkedPairs,
    safetyNotice: detectedInteractions.length === 0 ? MANDATORY_MSG : null,
    datasetLimitation: getInteractionLimitationNotice(interactionsDataset.length),
    disclaimer: "Informational screening only. Not clinically validated. Missing records do not prove pharmacological safety."
  };
}

/**
 * Checks if two drugs match an interaction entry in the dataset
 */
function findInteractionRecord(medA, medB, dataset) {
  for (const entry of dataset) {
    // Check by ID match
    const hasIdA = entry.drugIds.includes(medA.id);
    const hasIdB = entry.drugIds.includes(medB.id);
    if (hasIdA && hasIdB) {
      return entry;
    }

    // Check by generic name / active ingredient containment
    const namesA = [medA.brandName, medA.genericName, medA.activeIngredient].map(s => (s || "").toLowerCase());
    const namesB = [medB.brandName, medB.genericName, medB.activeIngredient].map(s => (s || "").toLowerCase());

    const entryDrugs = entry.drugs.map(d => d.toLowerCase());

    const matchesDrug1 = entryDrugs.some(d => namesA.some(n => n.includes(d)));
    const matchesDrug2 = entryDrugs.some(d => namesB.some(n => n.includes(d)));

    const reverseDrug1 = entryDrugs.some(d => namesB.some(n => n.includes(d)));
    const reverseDrug2 = entryDrugs.some(d => namesA.some(n => n.includes(d)));

    if ((matchesDrug1 && matchesDrug2) || (reverseDrug1 && reverseDrug2)) {
      return entry;
    }
  }

  return null;
}

function getInteractionLimitationNotice(count) {
  return `Dataset Limitation: Screening is evaluated against a curated reference subset of ${count} documented drug interactions (sources: US FDA, British National Formulary, ACCP). It does NOT screen all possible drug-drug, drug-food, or drug-disease contraindications.`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    screenInteractions,
    findInteractionRecord,
    MANDATORY_NO_INTERACTION_MESSAGE: MANDATORY_MSG
  };
}

if (typeof window !== "undefined") {
  window.NuskhaInteractionScreen = {
    screenInteractions,
    findInteractionRecord,
    MANDATORY_NO_INTERACTION_MESSAGE: MANDATORY_MSG
  };
}
