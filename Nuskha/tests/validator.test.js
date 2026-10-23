/**
 * Unit Tests: Image File Validator
 */

const assert = require("assert");
const { validateImageFile, MAX_FILE_SIZE_BYTES } = require("../src/ocr/imageValidator");

function runValidatorTests() {
  const suite = "Image Validator";
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  // Test 1: Valid PNG file
  test("accepts valid PNG within size limits", () => {
    const file = { name: "prescription.png", size: 1024 * 500, type: "image/png" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.fileMeta.ext, "png");
  });

  // Test 2: Valid JPG file
  test("accepts valid JPG within size limits", () => {
    const file = { name: "scan.jpg", size: 1024 * 1200, type: "image/jpeg" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.fileMeta.ext, "jpg");
  });

  // Test 3: Valid WEBP file
  test("accepts valid WEBP within size limits", () => {
    const file = { name: "box.webp", size: 1024 * 250, type: "image/webp" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, true);
  });

  // Test 4: Reject PDF
  test("rejects PDF documents with useful error", () => {
    const file = { name: "report.pdf", size: 1024 * 100, type: "application/pdf" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "INVALID_FORMAT");
    assert(res.error.includes("Unsupported file format"));
  });

  // Test 5: Reject empty file
  test("rejects empty or corrupt file (< 100 bytes)", () => {
    const file = { name: "empty.jpg", size: 12, type: "image/jpeg" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "FILE_TOO_SMALL");
  });

  // Test 6: Reject file > 10MB
  test("rejects file exceeding 10 MB limit", () => {
    const file = { name: "huge.png", size: MAX_FILE_SIZE_BYTES + 1024, type: "image/png" };
    const res = validateImageFile(file);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "FILE_TOO_LARGE");
    assert(res.error.includes("exceeds maximum limit"));
  });

  // Test 7: Null file
  test("handles null file safely", () => {
    const res = validateImageFile(null);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "FILE_MISSING");
  });

  return { suite, results };
}

module.exports = { runValidatorTests };
