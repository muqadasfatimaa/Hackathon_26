/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Reusable Modular UI Component (Framework-Agnostic)
 *
 * Can be mounted into any DOM container:
 *   const scanner = new PrescriptionScannerUI(containerElement, options);
 *   scanner.mount();
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PrescriptionScannerUI = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  class PrescriptionScannerUI {
    constructor(container, options = {}) {
      this.container = typeof container === "string" ? document.querySelector(container) : container;
      if (!this.container) {
        throw new Error("PrescriptionScannerUI: Target container element not found.");
      }

      this.options = {
        title: options.title || "Prescription & Packaging Scanner",
        subtitle: options.subtitle || "Real-time client-side OCR, structured medicine matching, and interaction screening",
        sampleImages: options.sampleImages || [
          { name: "Printed Rx (Amoxil + Disprin + Panadol)", url: "./sample_images/sample_prescription_printed.svg" },
          { name: "Augmentin 625mg Packaging", url: "./sample_images/sample_medicine_box.svg" },
          { name: "High-Risk Pair (Disprin + Coumadin)", url: "./sample_images/sample_interaction_pair.svg" }
        ],
        onScanComplete: options.onScanComplete || null,
        onTransferToDosage: options.onTransferToDosage || null,
        ...options
      };

      this.ocrEngine = typeof NuskhaOCREngine !== "undefined" ? new NuskhaOCREngine.OCREngine() : null;
      this.state = {
        file: null,
        previewUrl: null,
        fileMeta: null,
        isProcessing: false,
        progress: 0,
        progressMessage: "",
        rawText: "",
        editableText: "",
        ocrConfidence: null,
        matchResults: null,
        interactionResults: null,
        error: null
      };

      this.boundHandleDrop = this.handleDrop.bind(this);
      this.boundHandleDragOver = this.handleDragOver.bind(this);
      this.boundHandleDragLeave = this.handleDragLeave.bind(this);
      this.boundHandleFileSelect = this.handleFileSelect.bind(this);
    }

    mount() {
      this.render();
      this.attachEventListeners();
    }

    render() {
      this.container.innerHTML = `
        <div class="nuskha-scanner-wrapper">
          <!-- Header -->
          <div class="nuskha-scanner-header">
            <span class="nuskha-badge-stage">Stage 2 Modular Component</span>
            <h1 class="nuskha-scanner-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--nuskha-primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              ${this.options.title}
            </h1>
            <p class="nuskha-scanner-subtitle">${this.options.subtitle}</p>
          </div>

          <!-- Medical Safety & Privacy Disclaimer Banner -->
          <div class="nuskha-disclaimer-banner" role="alert">
            <div class="nuskha-disclaimer-icon">⚠️</div>
            <div class="nuskha-disclaimer-content">
              <h4>Medical Safety, OCR Accuracy & Privacy Notice</h4>
              <p>
                <strong>⚠️ Clinical Warning:</strong> OCR can make mistakes and unclear prescription instructions must be confirmed by a qualified healthcare professional before taking any medication.<br/>
                <strong>Verification Required:</strong> Optical Character Recognition (OCR) may misread medicine names, dosages, or strengths, particularly on handwritten prescriptions. Users must carefully review and edit extracted text against the original document before relying on matched information.
                <br/>
                <strong>Clinical Limitation:</strong> Missing interaction records do NOT prove pharmacological safety. This module is an educational and screening aid; it is NOT clinically validated and does NOT offer medical treatment advice or dosage instructions. Always consult a licensed physician or pharmacist.
                <br/>
                <strong>Privacy:</strong> All processing is performed locally in client memory; images and extracted text are not stored or transmitted.
              </p>
            </div>
          </div>

          <!-- Error Alert (Conditional) -->
          <div id="nuskha-error-container"></div>

          <!-- Two-Column Grid -->
          <div class="nuskha-scanner-grid">
            
            <!-- Left Column: Upload, Preview & OCR Control -->
            <div class="nuskha-scanner-col-left">
              
              <!-- Upload Card -->
              <div class="nuskha-card">
                <div class="nuskha-card-header">
                  <h3 class="nuskha-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    1. Upload Prescription or Packaging
                  </h3>
                  ${this.state.file ? `<button class="nuskha-btn nuskha-btn-danger nuskha-btn-sm" id="btn-clear-image">Clear & Reset</button>` : ""}
                </div>

                ${!this.state.file ? `
                  <div class="nuskha-dropzone" id="nuskha-dropzone">
                    <div class="nuskha-dropzone-icon">📷</div>
                    <p class="nuskha-dropzone-text">Drag & drop prescription image here, or browse</p>
                    <p class="nuskha-dropzone-hint">Supported formats: JPG, JPEG, PNG, WEBP (Max 10 MB)</p>
                    <input type="file" id="nuskha-file-input" class="nuskha-file-input" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"/>
                  </div>

                  <!-- Quick Sample Images -->
                  <div class="nuskha-samples-bar">
                    <span class="nuskha-samples-label">Quick Hackathon Test Samples:</span>
                    <div class="nuskha-samples-buttons">
                      ${this.options.sampleImages.map((s, idx) => `
                        <button class="nuskha-btn-sample" data-sample-url="${s.url}" data-sample-name="${s.name}">
                          ${s.name}
                        </button>
                      `).join("")}
                    </div>
                  </div>
                ` : `
                  <!-- Image Preview -->
                  <div class="nuskha-preview-container">
                    <div class="nuskha-preview-image-wrapper">
                      <img src="${this.state.previewUrl}" alt="Prescription preview" class="nuskha-preview-img" id="nuskha-preview-img"/>
                    </div>
                    <div class="nuskha-preview-meta">
                      <span><strong>File:</strong> ${this.state.fileMeta ? this.state.fileMeta.name : "Sample Image"}</span>
                      <span><strong>Size:</strong> ${this.state.fileMeta ? this.state.fileMeta.sizeFormatted : "N/A"}</span>
                    </div>

                    <!-- Process OCR Button -->
                    <button class="nuskha-btn nuskha-btn-primary" id="btn-run-ocr" ${this.state.isProcessing ? "disabled" : ""}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
                      ${this.state.isProcessing ? "Processing OCR..." : "Process Image with Real OCR"}
                    </button>
                  </div>
                `}

                <!-- Live Progress Box -->
                <div id="nuskha-progress-container" style="display:${this.state.isProcessing ? "block" : "none"}">
                  <div class="nuskha-progress-box">
                    <div class="nuskha-progress-header">
                      <span id="nuskha-progress-text">${this.state.progressMessage || "Processing image..."}</span>
                      <span id="nuskha-progress-pct">${Math.round(this.state.progress * 100)}%</span>
                    </div>
                    <div class="nuskha-progress-track">
                      <div class="nuskha-progress-bar" id="nuskha-progress-bar" style="width:${Math.round(this.state.progress * 100)}%"></div>
                    </div>
                  </div>
                </div>

                <!-- Handwriting Notice -->
                <div class="nuskha-handwriting-alert">
                  <strong>Handwriting Notice:</strong> Tesseract OCR is highly reliable on printed labels and typed packaging. Cursive doctor handwriting has inherent ambiguity and may yield low-confidence results. Please inspect the editable text area below.
                </div>
              </div>

              <!-- Editable Text Area Card -->
              <div class="nuskha-card">
                <div class="nuskha-card-header">
                  <h3 class="nuskha-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    2. Extracted OCR Text (Editable)
                  </h3>
                  ${this.state.ocrConfidence !== null ? `
                    <span class="nuskha-badge nuskha-badge-fuzzy">OCR Confidence: ${this.state.ocrConfidence}%</span>
                  ` : ""}
                </div>

                <div class="nuskha-ocr-editor-wrapper">
                  <textarea 
                    id="nuskha-ocr-textarea" 
                    class="nuskha-ocr-textarea" 
                    placeholder="Extracted text from the prescription will appear here. You can freely edit or type medicine names directly..."
                  >${this.state.editableText}</textarea>
                </div>

                <div class="nuskha-editor-actions">
                  <button class="nuskha-btn nuskha-btn-outline nuskha-btn-sm" id="btn-clear-text">Clear Text</button>
                  <button class="nuskha-btn nuskha-btn-primary nuskha-btn-sm" id="btn-rematch">
                    Re-run Medicine Matching & Screening
                  </button>
                </div>
              </div>

            </div>

            <!-- Right Column: Matching & Screening Results -->
            <div class="nuskha-scanner-col-right">
              
              <!-- Matched Medicines Card -->
              <div class="nuskha-card">
                <div class="nuskha-card-header">
                  <h3 class="nuskha-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                    3. Identified Medicines
                  </h3>
                  <span class="nuskha-badge ${this.state.matchResults && this.state.matchResults.totalMatches > 0 ? "nuskha-badge-exact" : "nuskha-badge-fuzzy"}">
                    ${this.state.matchResults ? `${this.state.matchResults.totalMatches} Identified` : "0 Identified"}
                  </span>
                </div>

                <div id="nuskha-matched-medicines-container">
                  ${this.renderMedicineResults()}
                </div>
              </div>

              <!-- Drug Interaction Screening Card -->
              <div class="nuskha-card">
                <div class="nuskha-card-header">
                  <h3 class="nuskha-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    4. Potential Medicine Interactions
                  </h3>
                </div>

                <div id="nuskha-interactions-container">
                  ${this.renderInteractionResults()}
                </div>
              </div>

            </div>

          </div>
        </div>
      `;
    }

    renderMedicineResults() {
      if (!this.state.matchResults) {
        return `
          <div class="nuskha-empty-state">
            <div class="nuskha-empty-icon">💊</div>
            <p>Upload a prescription and run OCR to detect structured medicine records.</p>
          </div>
        `;
      }

      const { exactMatches, possibleMatches, ambiguousMatches, unmatchedTokens, totalMatches, datasetCoverageNotice } = this.state.matchResults;

      if (totalMatches === 0 && ambiguousMatches.length === 0) {
        return `
          <div class="nuskha-empty-state">
            <div class="nuskha-empty-icon">🔍</div>
            <p>No known medicines from the documented dataset were found in the extracted text.</p>
            <p style="font-size:12px; color:var(--nuskha-text-muted)">Try editing the text above to check known brands (e.g. Amoxil, Augmentin, Disprin, Panadol, Lipitor, Glucophage).</p>
          </div>
          ${unmatchedTokens.length > 0 ? this.renderUnmatchedTokens(unmatchedTokens) : ""}
        `;
      }

      let html = "";

      // Exact Matches
      if (exactMatches.length > 0) {
        html += `<h4 style="font-size:13px; font-weight:700; color:#065f46; margin:0 0 8px 0;">✓ Exact Verified Matches (${exactMatches.length})</h4>`;
        for (const item of exactMatches) {
          html += this.renderMedicineCard(item, "exact");
        }
      }

      // Possible Matches (Fuzzy)
      if (possibleMatches.length > 0) {
        html += `<h4 style="font-size:13px; font-weight:700; color:#1e40af; margin:16px 0 8px 0;">≈ Likely / Fuzzy Matches (${possibleMatches.length})</h4>`;
        for (const item of possibleMatches) {
          html += this.renderMedicineCard(item, "fuzzy");
        }
      }

      // Ambiguous Matches
      if (ambiguousMatches.length > 0) {
        html += `<div class="nuskha-ambiguous-box">
          <strong>⚠️ Ambiguous Medicine Matches (${ambiguousMatches.length}):</strong>
          ${ambiguousMatches.map(a => `
            <div style="margin-top:6px;">
              • <em>"${a.token}"</em>: ${a.message}
            </div>
          `).join("")}
        </div>`;
      }

      // Unmatched Tokens
      if (unmatchedTokens.length > 0) {
        html += this.renderUnmatchedTokens(unmatchedTokens);
      }

      // Coverage Notice
      html += `<p style="font-size:11px; color:var(--nuskha-text-muted); margin-top:14px; border-top:1px solid #f1f5f9; padding-top:8px;">
        ${datasetCoverageNotice}
      </p>`;

      return html;
    }

    renderMedicineCard(item, badgeType) {
      const isExact = badgeType === "exact";
      return `
        <div class="nuskha-med-card">
          <div class="nuskha-med-header">
            <span class="nuskha-med-name">${item.brandName}</span>
            <span class="nuskha-badge ${isExact ? "nuskha-badge-exact" : "nuskha-badge-fuzzy"}">
              ${isExact ? "Exact Match" : `${item.matchType} (${item.confidencePercent}%)`}
            </span>
          </div>
          <div class="nuskha-med-details">
            <strong>Active Ingredient:</strong> ${item.activeIngredient || item.genericName}
          </div>
          <div class="nuskha-med-meta-grid">
            <div><strong>Strength:</strong> ${item.strength}</div>
            <div><strong>Dosage Form:</strong> ${item.dosageForm}</div>
            <div><strong>Category:</strong> ${item.category}</div>
          </div>
          <div class="nuskha-med-source">
            <strong>Source:</strong> ${item.source}
          </div>
          ${!isExact ? `
            <div style="font-size:11px; color:#1e40af; margin-top:4px;">
              Matched from OCR token: <code>"${item.originalToken}"</code>
            </div>
          ` : ""}
        
          <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #e2e8f0; display:flex; justify-content:flex-end;">
            <button type="button" class="nuskha-btn nuskha-btn-outline nuskha-btn-sm nuskha-btn-transfer" data-brand="${item.brandName}" data-strength="${item.strength}" data-ingredient="${item.activeIngredient || item.genericName}" style="font-size:12px; padding:6px 12px; font-weight:600; color:var(--nuskha-primary); border-color:var(--nuskha-primary);">
              Transfer to Dosage Assistant &rarr;
            </button>
          </div>
        </div>
      `;
    }

    renderUnmatchedTokens(unmatched) {
      const displayTokens = unmatched.slice(0, 10);
      return `
        <div class="nuskha-unmatched-box">
          <strong>Unmatched Candidate Words:</strong>
          <div>
            ${displayTokens.map(t => `<span class="nuskha-token-pill">${t.token}</span>`).join("")}
            ${unmatched.length > 10 ? `<span style="font-size:11px; color:#64748b;">+${unmatched.length - 10} more</span>` : ""}
          </div>
        </div>
      `;
    }

    renderInteractionResults() {
      if (!this.state.interactionResults) {
        return `
          <div class="nuskha-empty-state">
            <div class="nuskha-empty-icon">⚠️</div>
            <p>Potential drug-drug interactions will be screened automatically when 2 or more medicines are identified.</p>
          </div>
        `;
      }

      const { hasInteractions, detectedInteractions, unrecordedPairs, safetyNotice, datasetLimitation, disclaimer } = this.state.interactionResults;

      let html = "";

      if (hasInteractions) {
        html += `<div style="margin-bottom:12px;">
          <strong style="color:var(--nuskha-danger); font-size:14px;">
            ⚠️ ${detectedInteractions.length} Documented Clinical Interaction Warning(s) Detected
          </strong>
        </div>`;

        for (const item of detectedInteractions) {
          const isSevere = item.severity.toLowerCase().includes("severe") || item.severity.toLowerCase().includes("high");
          html += `
            <div class="nuskha-interaction-card ${isSevere ? "severe" : "moderate"}">
              <div class="nuskha-interaction-header">
                <span class="nuskha-interaction-title">${item.drugA} + ${item.drugB}</span>
                <span class="nuskha-badge ${isSevere ? "nuskha-badge-severe" : "nuskha-badge-moderate"}">
                  ${item.severity} Severity
                </span>
              </div>
              <div style="font-size:13px; font-weight:600; color:#0f172a;">${item.title}</div>
              <div class="nuskha-interaction-mechanism">
                <strong>Mechanism:</strong> ${item.mechanism}
              </div>
              <div style="font-size:12px; color:#334155; margin-bottom:6px;">
                <strong>Clinical Note:</strong> ${item.clinicalSummary}
              </div>
              ${item.isUncertain ? `
                <div class="nuskha-interaction-uncertainty">
                  ⚠️ <strong>Uncertain Identification:</strong> ${item.uncertaintyExplanation}
                </div>
              ` : ""}
              <div class="nuskha-interaction-source">
                <strong>Documented Source:</strong> ${item.source}
              </div>
            </div>
          `;
        }
      } else {
        // Step 4 Mandatory requirement:
        // "If no interaction record is found, show: 'No interaction record was found in the available dataset. This does not mean the combination is safe.'"
        html += `
          <div class="nuskha-no-interaction-card">
            <strong>Screening Result:</strong><br/>
            "No interaction record was found in the available dataset. This does not mean the combination is safe."
          </div>
        `;
      }

      if (unrecordedPairs && unrecordedPairs.length > 0 && hasInteractions) {
        html += `
          <div style="font-size:12px; color:var(--nuskha-text-muted); margin-top:8px;">
            Other pair combinations: "No interaction record was found in the available dataset. This does not mean the combination is safe."
          </div>
        `;
      }

      // Dataset Limitation Notice
      html += `
        <div style="font-size:11px; color:#64748b; margin-top:12px; border-top:1px solid #f1f5f9; padding-top:8px; line-height:1.45;">
          ${datasetLimitation}
          <br/>
          <em>${disclaimer}</em>
        </div>
      `;

      return html;
    }

    attachEventListeners() {
      // Dropzone
      const dropzone = this.container.querySelector("#nuskha-dropzone");
      const fileInput = this.container.querySelector("#nuskha-file-input");

      if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        dropzone.addEventListener("dragover", this.boundHandleDragOver);
        dropzone.addEventListener("dragleave", this.boundHandleDragLeave);
        dropzone.addEventListener("drop", this.boundHandleDrop);
        fileInput.addEventListener("change", this.boundHandleFileSelect);
      }

      // Sample image buttons
      const sampleButtons = this.container.querySelectorAll(".nuskha-btn-sample");
      sampleButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          const sampleUrl = btn.getAttribute("data-sample-url");
          const sampleName = btn.getAttribute("data-sample-name");
          this.loadSampleImage(sampleUrl, sampleName);
        });
      });

      // Clear image button
      const btnClearImage = this.container.querySelector("#btn-clear-image");
      if (btnClearImage) {
        btnClearImage.addEventListener("click", () => this.resetImage());
      }

      // Run OCR button
      const btnRunOcr = this.container.querySelector("#btn-run-ocr");
      if (btnRunOcr) {
        btnRunOcr.addEventListener("click", () => this.runOCR());
      }

      // Textarea input
      const textarea = this.container.querySelector("#nuskha-ocr-textarea");
      if (textarea) {
        textarea.addEventListener("input", (e) => {
          this.state.editableText = e.target.value;
        });
      }

      // Clear text button
      const btnClearText = this.container.querySelector("#btn-clear-text");
      if (btnClearText) {
        btnClearText.addEventListener("click", () => {
          this.state.editableText = "";
          const ta = this.container.querySelector("#nuskha-ocr-textarea");
          if (ta) ta.value = "";
          this.runMatchingAndScreening();
        });
      }

      // Rematch button
      const btnRematch = this.container.querySelector("#btn-rematch");
      if (btnRematch) {
        btnRematch.addEventListener("click", () => {
          const ta = this.container.querySelector("#nuskha-ocr-textarea");
          if (ta) this.state.editableText = ta.value;
          this.runMatchingAndScreening();
        });
      }

      // Transfer to Dosage Assistant bridge buttons
      const transferButtons = this.container.querySelectorAll(".nuskha-btn-transfer");
      transferButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          const brand = btn.getAttribute("data-brand") || "";
          const strength = btn.getAttribute("data-strength") || "";
          const ingredient = btn.getAttribute("data-ingredient") || "";
          if (typeof this.options.onTransferToDosage === "function") {
            this.options.onTransferToDosage({ brandName: brand, strength, activeIngredient: ingredient });
          } else if (typeof window.transferToDosageAssistant === "function") {
            window.transferToDosageAssistant(
              brand,
              strength,
              `Prescribed: ${brand} (${ingredient}) ${strength}`,
              ["morning"],
              "after_food"
            );
          }
        });
      });
    }

    handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = this.container.querySelector("#nuskha-dropzone");
      if (dropzone) dropzone.classList.add("dragover");
    }

    handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = this.container.querySelector("#nuskha-dropzone");
      if (dropzone) dropzone.classList.remove("dragover");
    }

    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = this.container.querySelector("#nuskha-dropzone");
      if (dropzone) dropzone.classList.remove("dragover");

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.processFile(files[0]);
      }
    }

    handleFileSelect(e) {
      const files = e.target.files;
      if (files && files.length > 0) {
        this.processFile(files[0]);
      }
    }

    processFile(file) {
      this.clearError();

      // Validate
      const validator = typeof NuskhaImageValidator !== "undefined" ? NuskhaImageValidator : null;
      if (validator) {
        const check = validator.validateImageFile(file);
        if (!check.valid) {
          this.showError(check.error);
          return;
        }
        this.state.fileMeta = check.fileMeta;
      } else {
        this.state.fileMeta = { name: file.name, sizeFormatted: `${(file.size / 1024).toFixed(1)} KB` };
      }

      this.state.file = file;
      if (this.state.previewUrl && this.state.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(this.state.previewUrl);
      }
      this.state.previewUrl = URL.createObjectURL(file);

      this.render();
      this.attachEventListeners();
    }

    async loadSampleImage(url, name) {
      this.clearError();
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load sample image: ${response.statusText}`);
        const blob = await response.blob();
        const file = new File([blob], name.replace(/[^a-z0-9]/gi, "_") + ".svg", { type: "image/svg+xml" });
        
        this.state.file = file;
        this.state.fileMeta = {
          name: name,
          sizeFormatted: `${(blob.size / 1024).toFixed(1)} KB`,
          type: "image/svg+xml"
        };
        this.state.previewUrl = url;

        this.render();
        this.attachEventListeners();
      } catch (err) {
        this.showError(`Error loading sample: ${err.message}`);
      }
    }

    async runOCR() {
      if (!this.state.file && !this.state.previewUrl) {
        this.showError("Please upload or select an image first.");
        return;
      }

      this.state.isProcessing = true;
      this.state.progress = 0;
      this.state.progressMessage = "Initializing OCR engine...";
      this.clearError();
      this.updateProgressUI();

      try {
        if (!this.ocrEngine && typeof NuskhaOCREngine !== "undefined") {
          this.ocrEngine = new NuskhaOCREngine.OCREngine();
        }

        if (!this.ocrEngine) {
          throw new Error("OCR Engine is not initialized.");
        }

        // Tesseract accepts File, Blob, URL, or HTMLImageElement
        const imgSource = this.container.querySelector("#nuskha-preview-img") || this.state.file || this.state.previewUrl;

        const ocrResult = await this.ocrEngine.processImage(imgSource, (prog) => {
          this.state.progress = prog.progress || 0;
          this.state.progressMessage = prog.message || "Processing...";
          this.updateProgressUI();
        });

        this.state.rawText = ocrResult.rawText;
        this.state.editableText = ocrResult.rawText;
        this.state.ocrConfidence = ocrResult.confidence;
        this.state.isProcessing = false;

        // Run matching & screening
        this.runMatchingAndScreening();

        if (typeof this.options.onScanComplete === "function") {
          this.options.onScanComplete({
            rawText: this.state.rawText,
            ocrConfidence: this.state.ocrConfidence,
            matchResults: this.state.matchResults,
            interactionResults: this.state.interactionResults
          });
        }
      } catch (err) {
        this.state.isProcessing = false;
        this.showError(`OCR processing failed: ${err.message}`);
        this.render();
        this.attachEventListeners();
      }
    }

    runMatchingAndScreening() {
      const matcher = typeof NuskhaMedicineMatcher !== "undefined" ? NuskhaMedicineMatcher : null;
      const screener = typeof NuskhaInteractionScreen !== "undefined" ? NuskhaInteractionScreen : null;

      if (matcher) {
        this.state.matchResults = matcher.matchMedicinesFromText(this.state.editableText);
      }

      if (screener && this.state.matchResults) {
        this.state.interactionResults = screener.screenInteractions(this.state.matchResults.allMatchedMedicines);
      }

      this.render();
      this.attachEventListeners();
    }

    updateProgressUI() {
      const box = this.container.querySelector("#nuskha-progress-container");
      const text = this.container.querySelector("#nuskha-progress-text");
      const pct = this.container.querySelector("#nuskha-progress-pct");
      const bar = this.container.querySelector("#nuskha-progress-bar");

      if (box) box.style.display = this.state.isProcessing ? "block" : "none";
      if (text) text.textContent = this.state.progressMessage;
      const pctStr = `${Math.round(this.state.progress * 100)}%`;
      if (pct) pct.textContent = pctStr;
      if (bar) bar.style.width = pctStr;
    }

    resetImage() {
      if (this.state.previewUrl && this.state.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(this.state.previewUrl);
      }
      this.state.file = null;
      this.state.previewUrl = null;
      this.state.fileMeta = null;
      this.state.rawText = "";
      this.state.editableText = "";
      this.state.ocrConfidence = null;
      this.state.matchResults = null;
      this.state.interactionResults = null;
      this.state.error = null;

      this.render();
      this.attachEventListeners();
    }

    showError(msg) {
      this.state.error = msg;
      const errBox = this.container.querySelector("#nuskha-error-container");
      if (errBox) {
        errBox.innerHTML = `
          <div class="nuskha-error-card">
            <strong>Error:</strong> ${msg}
          </div>
        `;
      }
    }

    clearError() {
      this.state.error = null;
      const errBox = this.container.querySelector("#nuskha-error-container");
      if (errBox) errBox.innerHTML = "";
    }

    destroy() {
      if (this.state.previewUrl && this.state.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(this.state.previewUrl);
      }
      if (this.ocrEngine) {
        this.ocrEngine.terminate();
      }
      this.container.innerHTML = "";
    }
  }

  return PrescriptionScannerUI;
});
