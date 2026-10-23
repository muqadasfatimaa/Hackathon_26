/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Text Normalizer & OCR Token Extraction
 */

/**
 * Normalizes text for medicine matching:
 * - Converts to lowercase
 * - Normalizes unicode and whitespace
 * - Standardizes common dosage notations (e.g., "500mg" -> "500 mg")
 * - Removes medical prescription noise keywords (Rx, Sig, Tab, etc.)
 */
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase();

  // Standardize common OCR dosage concatenations
  cleaned = cleaned.replace(/(\d+)\s*(mg|mcg|g|ml|iu|mEq)\b/gi, "$1 $2");

  // Replace common punctuation with spaces, keeping hyphens and slashes
  cleaned = cleaned.replace(/[^\w\s\-\/\.]/g, " ");

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Common medical prescription noise terms that should not be matched as drug names
 */
const MEDICAL_NOISE_TERMS = new Set([
  "rx", "sig", "tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule", "capsules",
  "po", "prn", "bid", "tid", "qid", "qd", "od", "daily", "once", "twice", "thrice",
  "take", "takes", "taking", "oral", "orally", "disp", "dispense", "dispensed",
  "refill", "refills", "qty", "quantity", "mg", "mcg", "ml", "g", "iu", "meq",
  "doctor", "dr", "clinic", "hospital", "patient", "name", "date", "age", "sex",
  "morning", "noon", "night", "evening", "bedtime", "after", "before", "meals", "food",
  "water", "hours", "days", "weeks", "months", "use", "apply", "as", "directed"
]);

/**
 * Extracts candidate tokens (unigrams and bigrams) from cleaned text
 */
function extractCandidateTokens(text) {
  if (!text) return [];

  const normalized = normalizeText(text);
  // Split into lines or words
  const words = normalized
    .split(/[\s,;:\n]+/)
    .map(w => w.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""))
    .filter(w => w.length >= 3 && !MEDICAL_NOISE_TERMS.has(w) && !/^\d+$/.test(w));

  const candidates = [];
  const seen = new Set();

  function addCandidate(token, type) {
    const cleanToken = token.trim();
    if (cleanToken.length >= 3 && !seen.has(cleanToken)) {
      seen.add(cleanToken);
      candidates.push({ token: cleanToken, type });
    }
  }

  // 1. Unigrams
  for (const word of words) {
    addCandidate(word, "unigram");
  }

  // 2. Bigrams (to catch compound names like "Amoxicillin Clavulanate", "Potassium Chloride")
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    addCandidate(bigram, "bigram");
  }

  return candidates;
}

/**
 * Computes Levenshtein edit distance between two strings
 */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a || a.length === 0) return b ? b.length : 0;
  if (!b || b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates a similarity score between 0.0 and 1.0
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();

  if (s1 === s2) return 1.0;

  // Exact substring containment boost
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    if (minLen >= 4 && minLen / maxLen >= 0.7) {
      return 0.92;
    }
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;

  return 1 - distance / maxLength;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeText,
    extractCandidateTokens,
    levenshteinDistance,
    calculateSimilarity,
    MEDICAL_NOISE_TERMS
  };
}

if (typeof window !== "undefined") {
  window.NuskhaTextNormalizer = {
    normalizeText,
    extractCandidateTokens,
    levenshteinDistance,
    calculateSimilarity,
    MEDICAL_NOISE_TERMS
  };
}
