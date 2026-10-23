/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Medicine Name Matching Engine (Exact, Fuzzy & Ambiguous Matching)
 */

let normalizer;
let defaultMedicines;

if (typeof require !== "undefined") {
  normalizer = require("./textNormalizer");
  defaultMedicines = require("../data/medicines").getAllMedicines();
} else {
  normalizer = window.NuskhaTextNormalizer;
  defaultMedicines = window.NuskhaMedicines.getAllMedicines();
}

const { normalizeText, extractCandidateTokens, calculateSimilarity } = normalizer;

/**
 * Match thresholds
 */
const THRESHOLDS = {
  EXACT: 1.0,
  HIGH_CONFIDENCE: 0.85,
  MINIMUM_MATCH: 0.70,
  AMBIGUITY_DELTA: 0.05 // if top 2 matches are within 0.05, mark as ambiguous
};

/**
 * Matches extracted or edited prescription text against the structured medicine dataset
 *
 * @param {string} text - Raw or edited OCR text
 * @param {Array} [dataset] - Custom medicine dataset or defaults to documented dataset
 * @returns {Object} Match results summary
 */
function matchMedicinesFromText(text, dataset = defaultMedicines) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      success: true,
      queryText: "",
      totalMatches: 0,
      exactMatches: [],
      possibleMatches: [],
      ambiguousMatches: [],
      unmatchedTokens: [],
      allMatchedMedicines: [],
      datasetCoverageNotice: getDatasetCoverageNotice(dataset.length)
    };
  }

  const candidateTokens = extractCandidateTokens(text);
  const matchedMedicineIds = new Set();
  const exactMatches = [];
  const possibleMatches = [];
  const ambiguousMatches = [];
  const unmatchedTokens = [];

  for (const candidate of candidateTokens) {
    const token = candidate.token;
    const scores = [];

    for (const med of dataset) {
      // Check brand name
      const brandSim = calculateSimilarity(token, med.brandName);
      scores.push({
        medicine: med,
        field: "brandName",
        matchedTerm: med.brandName,
        score: brandSim
      });

      // Check generic name
      const genericSim = calculateSimilarity(token, med.genericName);
      scores.push({
        medicine: med,
        field: "genericName",
        matchedTerm: med.genericName,
        score: genericSim
      });

      // Check aliases
      if (Array.isArray(med.aliases)) {
        for (const alias of med.aliases) {
          const aliasSim = calculateSimilarity(token, alias);
          scores.push({
            medicine: med,
            field: "alias",
            matchedTerm: alias,
            score: aliasSim
          });
        }
      }
    }

    // Sort by similarity descending
    scores.sort((a, b) => b.score - a.score);

    // Filter out duplicates of same medicine, keeping best score
    const uniqueMedScores = [];
    const seenMeds = new Set();
    for (const item of scores) {
      if (!seenMeds.has(item.medicine.id)) {
        seenMeds.add(item.medicine.id);
        uniqueMedScores.push(item);
      }
    }

    const topScore = uniqueMedScores[0];

    if (!topScore || topScore.score < THRESHOLDS.MINIMUM_MATCH) {
      // Only keep meaningful potential drug-name tokens in unmatched list
      if (token.length >= 4 && !/^\d+$/.test(token)) {
        unmatchedTokens.push({
          token,
          bestCandidate: topScore ? {
            name: topScore.medicine.brandName,
            score: Math.round(topScore.score * 100) / 100
          } : null
        });
      }
      continue;
    }

    // Check for ambiguity (two different medicines with very close scores)
    const secondScore = uniqueMedScores[1];
    const isAmbiguous =
      secondScore &&
      secondScore.score >= THRESHOLDS.MINIMUM_MATCH &&
      (topScore.score - secondScore.score) <= THRESHOLDS.AMBIGUITY_DELTA &&
      topScore.score < 0.98;

    if (isAmbiguous) {
      ambiguousMatches.push({
        token,
        type: "Ambiguous Match",
        candidates: [
          formatMatchItem(topScore.medicine, topScore, token),
          formatMatchItem(secondScore.medicine, secondScore, token)
        ],
        message: `Token "${token}" resembles both ${topScore.medicine.brandName} (${Math.round(topScore.score * 100)}%) and ${secondScore.medicine.brandName} (${Math.round(secondScore.score * 100)}%). Manual physician verification required.`
      });
      continue;
    }

    // Exact Match
    if (topScore.score >= THRESHOLDS.EXACT) {
      if (!matchedMedicineIds.has(topScore.medicine.id)) {
        matchedMedicineIds.add(topScore.medicine.id);
        exactMatches.push(formatMatchItem(topScore.medicine, topScore, token, "Exact Match"));
      }
    } else if (topScore.score >= THRESHOLDS.MINIMUM_MATCH) {
      // Possible / Fuzzy Match
      if (!matchedMedicineIds.has(topScore.medicine.id)) {
        matchedMedicineIds.add(topScore.medicine.id);
        const matchLabel = topScore.score >= THRESHOLDS.HIGH_CONFIDENCE ? "Likely Match" : "Possible Match";
        possibleMatches.push(formatMatchItem(topScore.medicine, topScore, token, matchLabel));
      }
    }
  }

  // Combine all matched unique medicines for interaction screening
  const allMatchedMedicines = [
    ...exactMatches.map(m => m.medicine),
    ...possibleMatches.map(m => m.medicine)
  ];

  return {
    success: true,
    queryText: text,
    totalMatches: exactMatches.length + possibleMatches.length,
    exactMatches,
    possibleMatches,
    ambiguousMatches,
    unmatchedTokens: deduplicateUnmatchedTokens(unmatchedTokens),
    allMatchedMedicines,
    datasetCoverageNotice: getDatasetCoverageNotice(dataset.length)
  };
}

function formatMatchItem(medicine, matchMeta, originalToken, matchType) {
  return {
    medicineId: medicine.id,
    brandName: medicine.brandName,
    genericName: medicine.genericName,
    activeIngredient: medicine.activeIngredient,
    strength: medicine.strength,
    dosageForm: medicine.dosageForm,
    category: medicine.category,
    source: medicine.source,
    notes: medicine.notes,
    matchType: matchType || (matchMeta.score >= 1.0 ? "Exact Match" : "Fuzzy Match"),
    matchedField: matchMeta.field,
    matchedTerm: matchMeta.matchedTerm,
    originalToken: originalToken,
    confidencePercent: Math.round(matchMeta.score * 100),
    confidenceScore: matchMeta.score,
    medicine: medicine
  };
}

function deduplicateUnmatchedTokens(tokens) {
  const seen = new Set();
  const deduped = [];
  for (const item of tokens) {
    if (!seen.has(item.token)) {
      seen.add(item.token);
      deduped.push(item);
    }
  }
  return deduped;
}

function getDatasetCoverageNotice(count) {
  return `Documented reference dataset currently includes ${count} verified medications (with FDA/WHO/BNF citations). OCR-extracted words not found in this catalog are highlighted as unmatched.`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    matchMedicinesFromText,
    THRESHOLDS
  };
}

if (typeof window !== "undefined") {
  window.NuskhaMedicineMatcher = {
    matchMedicinesFromText,
    THRESHOLDS
  };
}
