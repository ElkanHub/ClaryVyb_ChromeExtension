# GEMINI.md – General Development Guidelines for ClaryVyb

This document contains **strict instructions** for Gemini (or any AI assistant) when working on this project.  
The purpose is to **avoid ambiguity, ensure readability, and enforce structure** throughout development.  

---

## 📌 General Rules
1. Always **read and update `TODO.txt`** before making changes.  
   - If a feature or fix is requested, log it in `TODO.txt`.  
   - After implementing, mark it as **DONE** in `TODO.txt`.  
   - This ensures traceability and prevents repeated work.  

2. **Never overwrite files blindly.**  
   - Always check if a file already exists.  
   - If modifying, keep old code commented until confirmed working.  

3. **Code must be heavily commented.**  
   - Explain what each function does.  
   - Explain critical logic (state changes, DOM manipulation, API calls).  
   - Use `// SECTION: ...` headers for structure.  

4. **Keep code readable.**  
   - Consistent indentation (2 or 4 spaces, stick to one).  
   - Descriptive variable names (`minimizeButton` not `mb`).  
   - Break down large functions into smaller helpers.  

5. **Write testable units of code.**  
   - Functions should do **one clear task**.  
   - Example: `clarifyPrompt()` only handles API logic. UI updates are handled elsewhere.  

---

## 📌 Development Workflow
1. **Check `TODO.txt`:**  
   - Read pending tasks before coding.  
   - If something is unclear, add a clarifying note in `TODO.txt` before proceeding.  

2. **Implement Feature / Fix:**  
   - Add new code with clear section headers.  
   - If modifying existing logic, keep the old code **commented out** (for rollback).  

3. **Update `TODO.txt`:**  
   - Mark completed tasks as `DONE`.  
   - Add any follow-up tasks discovered during testing.  

4. **Testing Protocol:**  
   - Always add temporary `console.log()` outputs to test values, states, and API responses.  
   - Validate changes by running the extension in **Chrome Developer Mode**.  
   - Ensure no console errors or unhandled rejections.  

---

## 📌 UI/UX Boundaries
- Popup must use **glassmorphism styling** (blur, transparency, subtle shadows).  
- Popup must **minimize into a draggable circle** when required.  
- Circle must support **progress animation + status badge** as described in `SPEC.md`.  
- Do not add extra UI elements unless requested in `TODO.txt`.  

---

## 📌 Code Style & Structure
- **Popup logic** → in `popup.js`.  
- **UI styling** → in `popup.css`.  
- **Background tasks (API calls, listeners)** → in `background.js`.  
- **Manifest configuration** → `manifest.json`.  

### Example Commenting Style:
```js
// ========================
// SECTION: Minimize Logic
// ========================

// Function to minimize popup into a circle
function minimizePopup() {
  // Hide the popup container
  document.getElementById("popup").style.display = "none";

  // Show floating circle at bottom-right
  floatingCircle.style.display = "flex";
}
📌 Testing Guidelines[ Leave testing for the Developer!! ]
Test popup open/close behavior.

Test minimize button + click outside behavior.

Test API call simulation with mock data (before real API).

Test badge state transitions: idle → yellow → green.

Ensure copy button works in all states.

📌 Strict Boundaries
❌ Do NOT:

Add features not logged in TODO.txt.

Change core UX decisions (popup + minimize circle).

Remove existing comments or documentation.

✅ DO:

Follow the spec exactly as outlined in SPEC.md.

Keep all code readable and testable.

Always log progress in TODO.txt.

📌 Developer Workflow Summary
Read TODO.txt.

Implement only listed tasks.

Comment changes clearly.

Test extension in Chrome.

Update TODO.txt.

Repeat.

📌 Files You Must Respect
SPEC.md → Defines the product spec & UX (DO NOT DEVIATE).

GEMINI.md → These rules (ALWAYS FOLLOW).

TODO.txt → Task tracking (MUST BE UPDATED).

📌 Final Note
Gemini (or any assistant) must behave like a disciplined junior dev:

Follow orders.

Document everything.

Don’t improvise beyond what’s written.