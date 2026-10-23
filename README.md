# Nuskha AI (MediGuard) &middot; Healthcare Hackathon

A modern, responsive, and accessible medication-assistance web platform designed to empower patients, caregivers, and community healthcare workers with intelligent prescription parsing, visual bilingual dosage schedules, and transparent generic medicine matching.

---

## 🌟 Hackathon Stage 1: Foundation & UI Shell

In Stage 1, the core architecture, responsive user interface shell, navigation, and prototype presentation layer have been implemented using pure HTML5, CSS3, and modern vanilla JavaScript.

### Key Modules Implemented

1. **Brand & Responsive Navigation Shell**
   - Clean healthcare design language with a restrained teal and slate medical palette.
   - Header with brand identity (`Nuskha AI` / `MediGuard`) and interactive navigation pills.
   - Prominent clinical prototype disclaimer banner at the top and in the footer.
   - Single-Page-Application (SPA) view switching without page reloads, deep-linking via URL hash (`#dashboard`, `#scanner`, `#dosage`, `#generic`), and mobile responsive menu.

2. **Dashboard / Landing View**
   - Clear project mission statement and architecture overview.
   - Three feature cards with descriptive text, status tags, and direct navigation links.
   - Interactive 3-step workflow diagram explaining the medication management lifecycle.

3. **Prescription Scanner & Safety Checks (UI Shell)**
   - Drag-and-drop document upload zone and local file selector.
   - Sensible empty state with SVG iconography when no document is loaded.
   - Interactive demo presets (Sample 1: Antibiotic + Analgesic; Sample 2: Metabolic Care) to preview structured extraction cards.
   - Visual safety warning cards for contraindication checks and dosage thresholds.
   - Clear privacy guardrail: Zero personally identifiable information (PII) stored or transmitted.

4. **Visual Dosage Assistant (Urdu & Sindhi Accessibility)**
   - 4-slot daily dosage schedule: Morning (☀️), Afternoon (🌤️), Evening (🌅), Bedtime (🌙).
   - Dynamic 3-language selector: **English**, **اردو (Urdu)**, and **سنڌي (Sindhi)**.
   - High-contrast visual pill cards with count badges and food/water instructions.
   - Multilingual audio guidance button previews for low-literacy patient accessibility.

5. **Generic Medicine Matcher (UI Shell)**
   - Real-time search by Brand Name or Active Pharmaceutical Ingredient (Salt).
   - Form-based filter chips (All, Tablet, Capsule, Syrup).
   - Comparative data table showing Brand Name, Active Salt, Strength, Dosage Form, Bioequivalent Generic Alternative, and sample price indicators.
   - Informative pharmacist advisory disclaimers and empty search states.

---

## 🚀 How to Run and Test

The application has zero build dependencies and requires no `npm install`. It runs directly in any modern web browser.

### Option A: Direct Browser Launch
Simply double-click or open either of the following files in your web browser (Chrome, Edge, Firefox, Safari):
- `C:\Users\Abdul Latif\Desktop\Nuskha_Ai\Hackathon_26\index.html`
- `C:\Users\Abdul Latif\Desktop\Nuskha_Ai\Hackathon_26\Nuskha`

### Option B: Local Web Server (Recommended for testing)
From PowerShell or Command Prompt:

```powershell
# Navigate to the project directory
cd "C:\Users\Abdul Latif\Desktop\Nuskha_Ai\Hackathon_26"

# Start Python's built-in HTTP server
python -m http.server 8000
```

Then visit:
[http://localhost:8000](http://localhost:8000) (or `http://localhost:8000/Nuskha`)

---

## 🧪 Testing Checklist (Stage 1)

- [x] **Navigation:** Click on all header links (Dashboard, Prescription Scanner, Dosage Assistant, Generic Matcher) to confirm smooth view transitions.
- [x] **Dashboard Cards:** Click "Open Scanner Shell", "Open Dosage Assistant", and "Open Generic Matcher" on each card.
- [x] **Scanner Presets:** Click "Sample 1" and "Sample 2" in the Scanner view to view extracted data cards, and click "Reset" to return to the empty state.
- [x] **Multilingual Switcher:** In Dosage Assistant, toggle between English, اردو, and سنڌي to confirm real-time translation of slot headers and instructions.
- [x] **Generic Search & Filter:** In Generic Matcher, search for "panadol", "augmentin", or "omeprazole", and filter by form (Tablet, Capsule, Syrup).
- [x] **Responsive Layout:** Resize browser window to mobile width (<600px) to verify hamburger menu and single-column card stacking.

---

## 📋 What Remains for Stage 2

1. **AI Prescription OCR Engine:** Connecting real optical character recognition (OCR) or multimodal vision APIs to extract handwritten and printed prescription text.
2. **Clinical Rules Engine:** Implementing automated drug-drug interaction (DDI) checks, maximum daily dosage validation, and contraindication flagging.
3. **Speech Synthesis (TTS):** Hooking up Web Speech API or multilingual TTS for Urdu and Sindhi voice guidance.
4. **Expanded Regional Formulary:** Connecting or seeding a broader database of registered generic medicines and pricing data in Pakistan.
