/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Master Automated Test Suite & Step 7 Verification Runner
 *
 * Can be run via Node.js:
 *   node "Stage 2/tests/run-tests.js"
 */

const fs = require("fs");
const path = require("path");
const { runValidatorTests } = require("./validator.test");
const { runMatcherTests } = require("./matcher.test");
const { runInteractionTests } = require("./interactions.test");
const { getAllMedicines } = require("../src/data/medicines");
const { getAllInteractions, MANDATORY_NO_INTERACTION_MESSAGE } = require("../src/data/interactions");

console.log("================================================================================");
console.log("       NUSKHA AI — STAGE 2 PRESCRIPTION SCANNER AUTOMATED TEST SUITE            ");
console.log("================================================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function printSuiteResults(suite) {
  console.log(`\n--- Test Suite: ${suite.suite} ---`);
  for (const r of suite.results) {
    totalTests++;
    if (r.passed) {
      passedTests++;
      console.log(`  ✓ [PASS] ${r.name}`);
    } else {
      failedTests++;
      console.log(`  ✗ [FAIL] ${r.name}`);
      console.log(`      Error: ${r.error}`);
    }
  }
}

// 1. Validator Tests
printSuiteResults(runValidatorTests());

// 2. Matcher & Normalizer Tests
printSuiteResults(runMatcherTests());

// 3. Interaction Screening Tests
printSuiteResults(runInteractionTests());

// 4. File Integrity & Step 7 Checkpoints
console.log("\n--- Verification: Stage 2 File Structure & Constraints ---");

const stage2Dir = path.resolve(__dirname, "..");
const requiredFiles = [
  "README.md",
  "package.json",
  "src/index.js",
  "src/data/medicines.json",
  "src/data/medicines.js",
  "src/data/interactions.json",
  "src/data/interactions.js",
  "src/matcher/textNormalizer.js",
  "src/matcher/medicineMatcher.js",
  "src/interactions/interactionScreen.js",
  "src/ocr/imageValidator.js",
  "src/ocr/ocrEngine.js",
  "src/components/PrescriptionScannerUI.js",
  "styles/scanner.css",
  "preview/index.html",
  "sample_images/sample_prescription_printed.svg",
  "sample_images/sample_medicine_box.svg",
  "sample_images/sample_interaction_pair.svg",
  "tests/run-tests.js",
  "tests/validator.test.js",
  "tests/matcher.test.js",
  "tests/interactions.test.js"
];

let filesMissing = 0;
for (const relPath of requiredFiles) {
  const fullPath = path.join(stage2Dir, relPath);
  totalTests++;
  if (fs.existsSync(fullPath)) {
    passedTests++;
    console.log(`  ✓ [FILE EXISTS] Stage 2/${relPath}`);
  } else {
    failedTests++;
    filesMissing++;
    console.log(`  ✗ [FILE MISSING] Stage 2/${relPath}`);
  }
}

// 5. Dataset Quality & Sources Verification
console.log("\n--- Verification: Dataset Integrity & Documented Sources ---");

const medicines = getAllMedicines();
totalTests++;
if (medicines.length >= 15) {
  passedTests++;
  console.log(`  ✓ [DATASET COUNT] Loaded ${medicines.length} documented reference medicines (minimum 15 required)`);
} else {
  failedTests++;
  console.log(`  ✗ [DATASET COUNT] Only ${medicines.length} medicines found`);
}

let sourcesMissing = 0;
for (const med of medicines) {
  if (!med.source || (!med.source.includes("FDA") && !med.source.includes("WHO") && !med.source.includes("BNF"))) {
    sourcesMissing++;
  }
}
totalTests++;
if (sourcesMissing === 0) {
  passedTests++;
  console.log(`  ✓ [MEDICINE SOURCES] 100% of medicines contain documented regulatory sources (FDA, WHO, or BNF)`);
} else {
  failedTests++;
  console.log(`  ✗ [MEDICINE SOURCES] ${sourcesMissing} medicines missing authoritative regulatory source citations`);
}

const interactions = getAllInteractions();
totalTests++;
if (interactions.length >= 8) {
  passedTests++;
  console.log(`  ✓ [INTERACTIONS COUNT] Loaded ${interactions.length} documented interaction pairs`);
} else {
  failedTests++;
  console.log(`  ✗ [INTERACTIONS COUNT] Only ${interactions.length} interactions found`);
}

// Verify mandatory no interaction message
totalTests++;
const mandatoryNotice = "No interaction record was found in the available dataset. This does not mean the combination is safe.";
if (MANDATORY_NO_INTERACTION_MESSAGE === mandatoryNotice) {
  passedTests++;
  console.log(`  ✓ [SAFETY COMPLIANCE] Mandatory "no interaction record" message exactly matches required text`);
} else {
  failedTests++;
  console.log(`  ✗ [SAFETY COMPLIANCE] Mandatory message mismatch`);
}

// Summary
console.log("\n================================================================================");
console.log(`TEST SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log("================================================================================\n");

if (failedTests > 0) {
  console.error(`ERROR: ${failedTests} test(s) failed.`);
  process.exit(1);
} else {
  console.log("ALL AUTOMATED TESTS PASSED SUCCESSFULLY! (100% PASS RATE)");
  process.exit(0);
}
