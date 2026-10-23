# Nuskha AI &middot; Healthcare Hackathon

> **Tagline:** “Understand Medicines. Simplify Prescriptions. Support Safer Care.”

A modern, responsive, and accessible medication-assistance web platform designed to empower patients, caregivers, and community healthcare workers with intelligent prescription parsing, visual bilingual dosage schedules, and transparent generic medicine matching.

---

## 🌟 Project Architecture & Modules

### 1. Stage 1: Brand & Responsive Shell & Generic Matcher
- Medical design language with teal & slate palette, clinical disclaimer banners, and SPA tab navigation.
- Interactive Dashboard with 3-step medication lifecycle diagram.
- Generic Medicine Matcher: search by brand/salt with dosage form filter and cost difference indicators.

### 2. Stage 2: Prescription Scanner & Safety Checks
- Client-side document upload (JPG, PNG, WEBP) with strict file validation (<10MB, >100B).
- In-browser Optical Character Recognition (OCR) using Tesseract.js v5 with live progress reporting.
- Interactive extracted text editor for reviewing and editing OCR tokens.
- Structured medicine matcher against an authoritative 18-drug reference catalog (FDA NDC, WHO Essential Medicines, BNF 86).
- Pairwise drug-drug interaction screener with US FDA Boxed Warnings and mandatory disclaimers.
- Seamless bridge action button (**"Transfer to Dosage Assistant &rarr;"**) transferring confirmed medicines to Stage 3.

### 3. Stage 3: Visual Dosage Assistant
- 4-quad timeline (Morning ☀️, Afternoon 🌤️, Evening 🌅, Bedtime 🌙) and As-Needed (PRN 💧) section.
- Pictorial meal cues (After Food 🍽️, Before Food 🥛, With Food 🍲, If Fever/Pain 💧).
- Multilingual accessibility: **English**, **اردو (Urdu)**, and **سنڌي (Sindhi)**.
- Browser-native speech synthesis (TTS) for accessible voice readouts.
- Strict ambiguity and contradiction guardrails preventing prescription fabrication.

---

## 🚀 How to Run Locally

```powershell
cd Nuskha
node server.js
```
Then open [http://localhost:3000](http://localhost:3000).

*(Or directly open `Nuskha/index.html` in any modern web browser).*

---

## 🧪 Automated Testing

```powershell
cd Nuskha
node tests/run-tests.js
```
46 automated unit tests covering file validation, medicine matching, Levenshtein similarity, interaction screening, and dataset integrity (100% pass rate).

---

## ⚠️ Medical Disclaimer

Nuskha AI is developed strictly as a technology concept and research demonstration for a healthcare hackathon. It does not provide clinical diagnoses, medical advice, prescription writing, or pharmacy dispensations. Real medication decisions must always be directed by a licensed medical practitioner or registered pharmacist. OCR can make mistakes and unclear prescription instructions must be confirmed by a qualified healthcare professional.
