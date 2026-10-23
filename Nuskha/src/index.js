/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Unified Module Entry Point
 *
 * This file exports the modular components, datasets, and a unified
 * pipeline class for seamless integration into the main Nuskha AI application.
 */

const { OCREngine, HANDWRITING_DISCLAIMER } = require("./ocr/ocrEngine");
const { validateImageFile, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } = require("./ocr/imageValidator");
const { matchMedicinesFromText, THRESHOLDS } = require("./matcher/medicineMatcher");
const { normalizeText, extractCandidateTokens, calculateSimilarity } = require("./matcher/textNormalizer");
const { screenInteractions, MANDATORY_NO_INTERACTION_MESSAGE } = require("./interactions/interactionScreen");
const { medicinesData, getAllMedicines, getMedicineById, findMedicineByName } = require("./data/medicines");
const { interactionsData, getAllInteractions } = require("./data/interactions");

/**
 * Unified Prescription Scanner Pipeline Controller
 */
class PrescriptionScannerPipeline {
  constructor(options = {}) {
    this.ocrEngine = new OCREngine(options.ocr || {});
    this.state = {
      imageFile: null,
      imageUrl: null,
      fileMeta: null,
      rawOcrText: "",
      editableText: "",
      ocrConfidence: 0,
      matchedMedicines: [],
      ambiguousMatches: [],
      unmatchedTokens: [],
      interactions: [],
      status: "idle", // 'idle' | 'validating' | 'ready_to_scan' | 'scanning' | 'scanned' | 'error'
      error: null
    };
  }

  /**
   * Loads and validates an image file
   */
  loadImage(file) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      this.state.status = "error";
      this.state.error = validation.error;
      return { success: false, error: validation.error, code: validation.code };
    }

    this.state.imageFile = file;
    this.state.fileMeta = validation.fileMeta;
    this.state.error = null;
    this.state.status = "ready_to_scan";

    if (typeof window !== "undefined" && typeof URL !== "undefined") {
      if (this.state.imageUrl) {
        URL.revokeObjectURL(this.state.imageUrl);
      }
      this.state.imageUrl = URL.createObjectURL(file);
    }

    return { success: true, fileMeta: validation.fileMeta, previewUrl: this.state.imageUrl };
  }

  /**
   * Executes real OCR on the loaded image
   */
  async runOCR(onProgress) {
    if (!this.state.imageFile) {
      throw new Error("No image loaded to scan.");
    }

    this.state.status = "scanning";
    this.state.error = null;

    try {
      const ocrResult = await this.ocrEngine.processImage(this.state.imageFile, onProgress);
      this.state.rawOcrText = ocrResult.rawText;
      this.state.editableText = ocrResult.rawText;
      this.state.ocrConfidence = ocrResult.confidence;
      this.state.status = "scanned";

      // Automatically run matching on the extracted text
      const matchResults = this.match();

      return {
        success: true,
        ocrResult,
        matchResults
      };
    } catch (err) {
      this.state.status = "error";
      this.state.error = err.message;
      throw err;
    }
  }

  /**
   * Updates user-edited text and re-runs matching
   */
  updateText(newText) {
    this.state.editableText = newText || "";
    return this.match();
  }

  /**
   * Runs medicine name matching and interaction screening on current editable text
   */
  match() {
    const matchOutcome = matchMedicinesFromText(this.state.editableText);
    this.state.matchedMedicines = matchOutcome.allMatchedMedicines;
    this.state.ambiguousMatches = matchOutcome.ambiguousMatches;
    this.state.unmatchedTokens = matchOutcome.unmatchedTokens;

    const interactionOutcome = screenInteractions(this.state.matchedMedicines);
    this.state.interactions = interactionOutcome.detectedInteractions;

    return {
      matchOutcome,
      interactionOutcome
    };
  }

  /**
   * Resets all state and cleans up resources
   */
  reset() {
    if (this.state.imageUrl && typeof window !== "undefined" && typeof URL !== "undefined") {
      URL.revokeObjectURL(this.state.imageUrl);
    }
    this.state = {
      imageFile: null,
      imageUrl: null,
      fileMeta: null,
      rawOcrText: "",
      editableText: "",
      ocrConfidence: 0,
      matchedMedicines: [],
      ambiguousMatches: [],
      unmatchedTokens: [],
      interactions: [],
      status: "idle",
      error: null
    };
  }

  /**
   * Cleans up background OCR workers
   */
  async destroy() {
    this.reset();
    await this.ocrEngine.terminate();
  }
}

module.exports = {
  // Main Pipeline
  PrescriptionScannerPipeline,

  // OCR
  OCREngine,
  HANDWRITING_DISCLAIMER,
  validateImageFile,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,

  // Matcher
  matchMedicinesFromText,
  THRESHOLDS,
  normalizeText,
  extractCandidateTokens,
  calculateSimilarity,

  // Interactions
  screenInteractions,
  MANDATORY_NO_INTERACTION_MESSAGE,

  // Datasets
  medicinesData,
  getAllMedicines,
  getMedicineById,
  findMedicineByName,
  interactionsData,
  getAllInteractions
};
