# Nuskha AI &middot; Visual Dosage Assistant (Stage 3)

This directory (`Nuskha`) contains the complete frontend application for **Nuskha AI**, featuring the **Stage 3: Visual Dosage Assistant** with accessible Urdu (اردو) and Sindhi (سنڌي) voice guidance, safety validation guardrails, and direct bridges to the Prescription Scanner and Generic Matcher.

---

## 🌟 Stage 3 Features Implemented

1. **Prescription Instruction Entry & Review Interface:**
   - **Medicine Name & Strength/Form:** Clear input fields for medication name, dose form (e.g., Capsule, Tablet, Syrup), and strength.
   - **Exact Prescribed Instruction Field:** Records what the doctor specifically wrote on the prescription slip.
   - **Confirmed Time-of-Day Checkboxes:** Explicit slots for **Morning (☀️)**, **Afternoon (🌤️)**, **Evening (🌅)**, **Bedtime (🌙)**, and **As Needed / PRN (💧)**.
   - **Meal Relation Cues:** Pictorial labels for *After Food (🍽️)*, *Before Food (🥛)*, *With Food (🍲)*, and *If Fever/Pain (💧)*.
   - **Quantity per Dose:** Dedicated quantity badge specification (e.g., "1 Cap", "1 Tab").

2. **Strict Ambiguity & Safety Guardrails:**
   - **No Prescription Fabrication:** The application organizes confirmed instructions; it never guesses or infers missing timings or dosages.
   - **Ambiguity Detection Engine:** Automatically flags vague instructions (e.g. shorthand like "take as needed", "prn", "qds", "as directed" without confirmed time slots).
   - Prompts the user with a clinical safety alert to verify unclear instructions with their doctor or pharmacist before scheduling.

3. **Stage 2 Bridge (Scanner ➔ Dosage Assistant):**
   - Each extracted card in the Prescription Scanner includes a **"Transfer to Dosage Assistant for Review &rarr;"** action button.
   - Pre-fills the Dosage Assistant review form with the medication name, strength, and raw instructions.
   - Displays a prominent review notice requiring the user to verify the exact time slots before generating the schedule.

4. **Dynamic Visual Schedule Board:**
   - 4-quad timeline (Morning, Afternoon, Evening, Bedtime) with pictorial icons, dose badges, and exact instruction quotes.
   - Dedicated **As Needed (PRN)** section for intermittent symptom-relief medications.
   - In-place **Edit (✏️)** and **Delete (🗑️)** controls on each scheduled medicine card.
   - **Print / PDF Optimization:** Built-in `@media print` layout allowing patients or caregivers to print out a clean, high-contrast wall chart for their medicine box or refrigerator.
   - Pre-loaded verified demo regimens (Dual Therapy & Chronic Care) for rapid demonstration.

5. **Urdu and Sindhi Language Accessibility:**
   - Dynamic 3-way language selector: **English**, **اردو (Urdu)**, and **سنڌي (Sindhi)**.
   - Full translation of slot names, meal instructions, buttons, reminder notices, and safety disclaimers into Urdu (Nastaliq style) and Sindhi.

6. **Accessible Text-To-Speech (TTS) Voice Engine:**
   - Implemented via the browser's native Web Speech API (`SpeechSynthesisUtterance`).
   - Master schedule audio readout button (**"Listen Schedule Readout (آواز سنیں)"**) and per-slot voice guidance.
   - Intelligent voice detection: selects Urdu (`ur`, `ur-PK`) or Sindhi (`sd`), with automatic fallback to regional/phonetic speech synthesis if specific localized voice packs are not installed on the host OS.
   - Visual audio status banner informing the user of the voice synthesizer state.

---

## 🚀 How to Run and Test the Application

### Option A: Using the Local Node.js Server
From PowerShell or Command Prompt:

```powershell
# Navigate directly to the Nuskha project folder
cd "C:\Users\Abdul Latif\Desktop\Nuskha_Ai\Hackathon_26\Nuskha"

# Start the application server
node server.js
```

Then open your browser at: **`http://localhost:3000`**

### Option B: Direct Browser Launch
Simply double-click:
`C:\Users\Abdul Latif\Desktop\Nuskha_Ai\Hackathon_26\Nuskha\index.html`

---

## 🧪 Testing Performed

1. **Dashboard & Navigation:** Tested view switching across Dashboard, Prescription Scanner, Dosage Assistant, and Generic Matcher.
2. **Medication Addition:** Inputted sample prescription (`Amoxicillin 500mg`, 1 cap morning and bedtime after meals) and confirmed visual cards rendered into Morning and Bedtime slots.
3. **Ambiguity Guardrail:** Inputted vague shorthand (`"take prn as directed"`) without checking time slots; verified that the application blocked submission and rendered a clinical verification warning.
4. **Edit & Delete Flow:** Edited a medicine's quantity and verified live update; deleted an item and verified proper removal.
5. **Urdu & Sindhi Localization:** Switched between English, اردو, and سنڌي; verified all UI strings, slot titles, and meal instructions translated instantly.
6. **Voice Synthesis (TTS):** Tested `masterSpeechBtn` and per-slot audio triggers; verified speech synthesis initialization and graceful fallback handling.
7. **Scanner Bridge:** Clicked "Transfer to Dosage Assistant" in the Scanner module; verified smooth navigation to the Dosage Assistant with pre-filled inputs and review banner.
8. **Responsive Layout & Print:** Tested mobile viewport collapsing and `@media print` styling.
