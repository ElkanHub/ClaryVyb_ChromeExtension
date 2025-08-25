## ClaryVyb Chrome Extension – Spec & Build Instructions
## Overview

ClaryVyb is a Chrome extension that helps users write better prompts by clarifying and making them more concise.
Instead of relying on a traditional popup, the extension injects a glassmorphic draggable widget into the user’s current page.
The widget can expand/collapse, show API progress states, and stay non-intrusive while the user works.

## Core Features (MVP)

Glassmorphic Widget (Expandable/Collapsible)

Collapsed state:

Small draggable floating circle (bottom-right by default).

Circle contains the logo/initial.

Expanded state (Glass Panel):

Textarea for input.

Buttons:

Clarify

Concise

Copy

Output box for rewritten prompt.

Minimize button to collapse back to circle.

Status Indicators on Floating Circle

While API call is running:

Show spinning progress animation inside the circle.

Show yellow badge at the bottom-right corner of circle.

When API response is ready:

Badge turns green.

Spinner stops.

Clicking the circle expands the panel again with the updated output.

Draggable Widget

Users can click and drag the circle or expanded panel anywhere on screen.

Widget remembers last position (saved via chrome.storage.local).

Non-Intrusive Behavior

Widget overlays current page without breaking site layout.

Transparent background with glassmorphism style.

Clicking outside expanded widget collapses it back into the circle.

Extension does not auto-close after Copy.

File Structure
claryvyb-extension/
│── manifest.json
│── content.js         # Injects widget into page
│── widget.html        # Markup for widget
│── widget.js          # Logic for widget expand/collapse + API
│── widget.css         # Glassmorphism styles
│── background.js      # Optional: API handling, Pro features
│── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png

Manifest.json (Manifest V3)
{
  "manifest_version": 3,
  "name": "ClaryVyb",
  "version": "1.0",
  "description": "Clarify and simplify prompts for AI platforms.",
  "permissions": ["storage", "activeTab", "scripting"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}

Widget.html (Glassmorphism Layout)

Glass-style overlay injected into page.

Collapsed Circle (Default):

div#claryvyb-circle (logo, draggable, progress spinner, badge).

Expanded Panel:

div#claryvyb-panel (glass card).

Components:

Header: logo + minimize button.

Textarea for user input.

Buttons: Clarify, Concise, Copy.

Output container for result.

Widget.css (Glassmorphism Style)

Key styling principles:

Transparency + blur (backdrop-filter).

Soft rounded corners.

Shadow for floating effect.

Circle: 60x60px, draggable, fixed position bottom-right.

Example:

.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 16px;
  width: 300px;
}
#claryvyb-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  cursor: grab;
  z-index: 999999;
}

Widget.js (Core Logic)

Handle expand/collapse (circle ↔ panel).

Handle dragging logic (mousedown → mousemove → mouseup).

API Call Flow:

User clicks Clarify/Concise → minimize into circle.

Circle shows spinner + yellow badge.

API returns → badge turns green, spinner stops.

Clicking circle expands panel with output.

API Integration

Option A (Rules-based JavaScript cleanup).
Option B (OpenAI API → Pro upgrade).

Interaction Flow

User installs extension → widget loads automatically on every page.

User sees floating circle (idle state).

Expands panel → types prompt → clicks Clarify/Concise.

Panel collapses → spinner + yellow badge shows progress.

When ready → badge turns green → user clicks circle → sees output.

User copies → panel stays open.

Clicking outside panel → collapses back to circle.

Future Enhancements (Post-MVP)

Inline Grammarly-style textbox injection.

Templates & prompt history.

Dark mode toggle.

Pro upgrade (via Gumroad/Payhip).