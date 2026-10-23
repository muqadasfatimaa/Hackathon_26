/**
 * Unit Tests: Medicine Matcher & Text Normalizer
 */

const assert = require("assert");
const { normalizeText, calculateSimilarity } = require("../src/matcher/textNormalizer");
const { matchMedicinesFromText } = require("../src/matcher/medicineMatcher");

function runMatcherTests() {
  const suite = "Medicine Matcher & Normalization";
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // Test 1: Text normalization
  test("normalizes text and collapses dosage tokens", () => {
    const raw = "Rx: Take Amoxil 500mg, 1 tab PO BID!";
    const normalized = normalizeText(raw);
    assert(normalized.includes("amoxil 500 mg"));
    assert(!normalized.includes("!"));
  });

  // Test 2: Similarity computation
  test("computes Levenshtein similarity correctly", () => {
    assert.strictEqual(calculateSimilarity("Amoxil", "Amoxil"), 1.0);
    const fuzzyScore = calculateSimilarity("Augmentn", "Augmentin");
    assert(fuzzyScore >= 0.85);
  });

  // Test 3: Exact brand match
  test("matches exact brand name 'Amoxil' from raw prescription string", () => {
    const text = "Prescription: Amoxil 500 mg capsules. Disp: 21";
    const res = matchMedicinesFromText(text);
    assert.strictEqual(res.success, true);
    assert(res.exactMatches.length >= 1);
    const matched = res.exactMatches.find(m => m.brandName === "Amoxil");
    assert(matched);
    assert.strictEqual(matched.confidencePercent, 100);
    assert.strictEqual(matched.activeIngredient, "Amoxicillin Trihydrate");
  });

  // Test 4: Exact generic match
  test("matches generic active ingredient 'Atorvastatin'", () => {
    const text = "Tab Atorvastatin 20 mg once daily at night";
    const res = matchMedicinesFromText(text);
    const matched = res.exactMatches.find(m => m.genericName.toLowerCase().includes("atorvastatin"));
    assert(matched);
    assert.strictEqual(matched.brandName, "Lipitor");
  });

  // Test 5: Fuzzy match with common OCR typos
  test("identifies medicine with minor OCR typo ('Augmentn 625mg')", () => {
    const text = "Patient prescribed Augmentn 625mg tablets";
    const res = matchMedicinesFromText(text);
    const matched = res.possibleMatches.find(m => m.brandName === "Augmentin");
    assert(matched);
    assert(matched.confidencePercent >= 75);
    assert.strictEqual(matched.originalToken.toLowerCase(), "augmentn");
  });

  // Test 6: Unknown words
  test("collects unknown non-medical tokens as unmatched", () => {
    const text = "Patient takes Xylophantozine 50mg daily";
    const res = matchMedicinesFromText(text);
    assert(res.unmatchedTokens.some(u => u.token.toLowerCase() === "xylophantozine"));
  });

  // Test 7: Empty or whitespace input
  test("handles empty string gracefully without error", () => {
    const res = matchMedicinesFromText("   \n\t  ");
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.totalMatches, 0);
    assert.strictEqual(res.allMatchedMedicines.length, 0);
  });

  // Test 8: Multiple medicines in single text
  test("matches multiple medications from multi-line prescription", () => {
    const text = `
      1. Disprin 100 mg - 1 tab daily
      2. Coumadin 5 mg - 1 tab at 6pm
      3. Panadol 500 mg - 1 tab PRN
    `;
    const res = matchMedicinesFromText(text);
    assert.strictEqual(res.exactMatches.length, 3);
    const names = res.exactMatches.map(m => m.brandName);
    assert(names.includes("Disprin"));
    assert(names.includes("Coumadin"));
    assert(names.includes("Panadol"));
  });

  return { suite, results };
}

module.exports = { runMatcherTests };
