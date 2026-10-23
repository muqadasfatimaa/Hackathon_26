/**
 * Unit Tests: Drug Interaction Screening Engine
 */

const assert = require("assert");
const { screenInteractions, MANDATORY_NO_INTERACTION_MESSAGE } = require("../src/interactions/interactionScreen");
const { getMedicineById } = require("../src/data/medicines");

function runInteractionTests() {
  const suite = "Interaction Screening";
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // Test 1: Severe interaction (Aspirin + Warfarin)
  test("detects severe Aspirin + Warfarin bleeding interaction", () => {
    const medA = getMedicineById("aspirin-100");
    const medB = getMedicineById("warfarin-5");
    assert(medA && medB, "Test medicines must exist in dataset");

    const outcome = screenInteractions([medA, medB]);
    assert.strictEqual(outcome.hasInteractions, true);
    assert.strictEqual(outcome.detectedInteractions.length, 1);

    const int = outcome.detectedInteractions[0];
    assert.strictEqual(int.severity, "Severe");
    assert(int.title.includes("Hemorrhage") || int.title.includes("Bleeding"));
    assert(int.source.includes("FDA") || int.source.includes("BNF"));
    assert(int.mechanism.length > 20);
  });

  // Test 2: Moderate interaction (Aspirin + Ibuprofen)
  test("detects moderate Aspirin + Ibuprofen interaction", () => {
    const medA = getMedicineById("aspirin-100");
    const medB = getMedicineById("ibuprofen-400");
    const outcome = screenInteractions([medA, medB]);

    assert.strictEqual(outcome.hasInteractions, true);
    const int = outcome.detectedInteractions[0];
    assert.strictEqual(int.severity, "Moderate");
  });

  // Test 3: Unrecorded pair MANDATORY disclaimer text
  test("displays exact mandatory notice when no interaction record is found", () => {
    const medA = getMedicineById("amoxicillin-500"); // Amoxil
    const medB = getMedicineById("paracetamol-500"); // Panadol
    const outcome = screenInteractions([medA, medB]);

    assert.strictEqual(outcome.hasInteractions, false);
    assert.strictEqual(outcome.detectedInteractions.length, 0);

    // Exact string match required by Step 4
    const expected = "No interaction record was found in the available dataset. This does not mean the combination is safe.";
    assert.strictEqual(outcome.safetyNotice, expected);
    assert.strictEqual(MANDATORY_NO_INTERACTION_MESSAGE, expected);
  });

  // Test 4: Single medicine input
  test("handles single medicine safely without false alerts", () => {
    const medA = getMedicineById("amoxicillin-500");
    const outcome = screenInteractions([medA]);
    assert.strictEqual(outcome.hasInteractions, false);
    assert.strictEqual(outcome.pairCount, 0);
  });

  // Test 5: Uncertain match identification flag
  test("marks interaction as uncertain if medicine originated from fuzzy match", () => {
    const medA = {
      medicine: getMedicineById("aspirin-100"),
      matchType: "Possible Match",
      confidenceScore: 0.82,
      confidencePercent: 82,
      originalToken: "disprn"
    };
    const medB = {
      medicine: getMedicineById("warfarin-5"),
      matchType: "Exact Match",
      confidenceScore: 1.0,
      confidencePercent: 100
    };

    const outcome = screenInteractions([medA, medB]);
    assert.strictEqual(outcome.hasInteractions, true);
    const int = outcome.detectedInteractions[0];
    assert.strictEqual(int.isUncertain, true);
    assert(int.uncertaintyExplanation.includes("disprn"));
    assert(int.uncertaintyExplanation.includes("82%"));
  });

  return { suite, results };
}

module.exports = { runInteractionTests };
