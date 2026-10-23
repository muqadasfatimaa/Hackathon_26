/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * OCR Engine Controller (Tesseract.js Integration)
 *
 * Implements real OCR recognition with progress reporting,
 * line segmentation, confidence scoring, and explicit handwriting disclaimer.
 */

const HANDWRITING_DISCLAIMER =
  "Notice on OCR Accuracy: Optical Character Recognition performs reliably on high-contrast printed text (such as typed prescriptions, medicine packaging labels, and pharmacy dispense receipts). Handwritten doctor scripts often contain cursive abbreviations and idiosyncratic penmanship that standard OCR cannot reliably parse. Always review and correct the extracted text in the editor below before running medicine matching.";

class OCREngine {
  constructor(options = {}) {
    this.language = options.language || "eng";
    this.worker = null;
    this.isInitializing = false;
    this.activeTask = null;
  }

  /**
   * Discovers the Tesseract instance (window.Tesseract in browser or require('tesseract.js') in Node)
   */
  getTesseract() {
    if (typeof window !== "undefined" && window.Tesseract) {
      return window.Tesseract;
    }
    if (typeof require !== "undefined") {
      try {
        return require("tesseract.js");
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  /**
   * Initializes the Tesseract OCR worker with progress callbacks
   */
  async initWorker(onProgress) {
    if (this.worker) return this.worker;

    const Tesseract = this.getTesseract();
    if (!Tesseract) {
      throw new Error(
        "Tesseract.js is not loaded. In browser, include the Tesseract.js script tag; in Node.js, install tesseract.js via npm."
      );
    }

    if (onProgress) {
      onProgress({ status: "initializing", progress: 0.1, message: "Initializing Tesseract OCR worker..." });
    }

    // Tesseract v5 API
    if (typeof Tesseract.createWorker === "function") {
      const worker = await Tesseract.createWorker(this.language, 1, {
        logger: m => {
          if (onProgress && m) {
            const rawProg = typeof m.progress === "number" ? m.progress : 0;
            const status = m.status || "processing";
            onProgress({
              status,
              progress: Math.min(1.0, Math.max(0.1, rawProg)),
              message: formatProgressMessage(m)
            });
          }
        }
      });
      this.worker = worker;
      return worker;
    }

    return null;
  }

  /**
   * Processes an image file, URL, Canvas, or Buffer
   *
   * @param {File|Blob|string|HTMLCanvasElement|Buffer} imageSource - The image to process
   * @param {Function} [onProgress] - Optional progress callback ({ status, progress, message })
   * @returns {Promise<Object>} Extracted OCR result
   */
  async processImage(imageSource, onProgress) {
    const startTime = Date.now();

    if (!imageSource) {
      throw new Error("No image source provided for OCR processing.");
    }

    const Tesseract = this.getTesseract();
    if (!Tesseract) {
      throw new Error("Tesseract.js OCR library is unavailable in current runtime.");
    }

    if (onProgress) {
      onProgress({ status: "loading", progress: 0.05, message: "Preparing image for optical analysis..." });
    }

    try {
      // Use createWorker if available for granular control and reuse
      const worker = await this.initWorker(onProgress);

      let recognizeResult;
      if (worker && typeof worker.recognize === "function") {
        recognizeResult = await worker.recognize(imageSource);
      } else if (typeof Tesseract.recognize === "function") {
        // Fallback to high-level recognize
        recognizeResult = await Tesseract.recognize(imageSource, this.language, {
          logger: m => {
            if (onProgress && m) {
              onProgress({
                status: m.status || "recognizing",
                progress: m.progress || 0.5,
                message: formatProgressMessage(m)
              });
            }
          }
        });
      } else {
        throw new Error("Unable to execute Tesseract recognition method.");
      }

      const data = recognizeResult.data || {};
      const rawText = (data.text || "").trim();
      const confidence = typeof data.confidence === "number" ? Math.round(data.confidence) : 0;
      const lines = Array.isArray(data.lines)
        ? data.lines.map(l => ({ text: l.text.trim(), confidence: Math.round(l.confidence) })).filter(l => l.text.length > 0)
        : rawText.split("\n").map(t => ({ text: t.trim(), confidence })).filter(l => l.text.length > 0);

      const durationMs = Date.now() - startTime;

      if (onProgress) {
        onProgress({ status: "completed", progress: 1.0, message: "OCR processing complete." });
      }

      return {
        success: true,
        rawText,
        lines,
        confidence,
        durationMs,
        charCount: rawText.length,
        wordCount: rawText.split(/\s+/).filter(w => w.length > 0).length,
        handwritingDisclaimer: HANDWRITING_DISCLAIMER
      };
    } catch (err) {
      if (onProgress) {
        onProgress({ status: "error", progress: 0, message: `OCR failed: ${err.message}` });
      }
      throw new Error(`OCR processing error: ${err.message}`);
    }
  }

  /**
   * Terminates the active worker to free system memory
   */
  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        // ignore cleanup error
      }
      this.worker = null;
    }
  }
}

function formatProgressMessage(m) {
  if (!m || !m.status) return "Processing image...";
  const status = m.status;
  const pct = m.progress ? Math.round(m.progress * 100) : 0;

  switch (status) {
    case "loading tesseract core":
      return "Loading Tesseract OCR Core engine...";
    case "loaded tesseract core":
      return "Tesseract Core loaded.";
    case "loading language traineddata":
      return `Loading English trained language model (${pct}%)...`;
    case "loaded language traineddata":
      return "English language model loaded.";
    case "initializing api":
      return "Initializing OCR recognition API...";
    case "initialized api":
      return "OCR recognition API ready.";
    case "recognizing text":
      return `Recognizing text from image... ${pct}%`;
    default:
      return `${status}: ${pct}%`;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    OCREngine,
    HANDWRITING_DISCLAIMER
  };
}

if (typeof window !== "undefined") {
  window.NuskhaOCREngine = {
    OCREngine,
    HANDWRITING_DISCLAIMER
  };
}
