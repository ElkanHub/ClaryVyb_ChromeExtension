## ClaryVyb Chrome Extension – Technical Specification

---

### **Document Version:** 1.0
### **Last Updated:** 2025-08-26

---

## 1. Overview

ClaryVyb is a Chrome extension designed to help users refine and improve their writing prompts for AI platforms. It provides a non-intrusive, on-page widget that allows for quick prompt clarification and simplification without disrupting the user's workflow.

The core of the extension is a draggable, glassmorphic widget that can be expanded for prompt input or collapsed into a small, floating circle to save space.

---

## 2. Core Functionality

### 2.1. Draggable Widget

The widget is the central UI component of the extension. It can be moved freely around the screen and its position is saved locally, so it remembers where you last placed it.

#### 2.1.1. Collapsed State (Floating Circle)

*   **Appearance:** A 60x60px circular button with a semi-transparent, blurred background (glassmorphism).
*   **Behavior:**
    *   Displays the extension's logo or an initial.
    *   Can be dragged and dropped anywhere on the screen.
    *   A single click expands the widget into the full panel.

#### 2.1.2. Expanded State (Glass Panel)

*   **Appearance:** A rectangular panel with a glassmorphic background.
*   **Components:**
    *   **Header:** Contains the extension logo and a minimize button.
    *   **Prompt Input:** A textarea for users to enter their text.
    *   **Action Buttons:**
        *   `Clarify`: (API call placeholder) To make the prompt more detailed.
        *   `Concise`: (API call placeholder) To make the prompt shorter.
        *   `Copy`: To copy the output to the clipboard.
    *   **Output Container:** A read-only area to display the refined prompt.
*   **Behavior:**
    *   Clicking the minimize button collapses the panel back into the floating circle.
    *   The panel's position is constrained to the viewport, ensuring it's always accessible.

### 2.2. Status Indicators

*This functionality is planned for future API integration.*

*   **In Progress:** When an API call is active, the floating circle will display a spinning progress animation and a yellow status badge.
*   **Completed:** When the API call is finished, the spinner will stop, and the badge will turn green, indicating the output is ready.

---

## 3. Technical Implementation

### 3.1. File Structure

```
claryvyb-extension/
├── manifest.json
├── content.js
├── widget.js
├── widget.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 3.2. Manifest (`manifest.json`)

*   **Version:** Manifest V3
*   **Permissions:** `storage`, `activeTab`, `scripting`
*   **Content Scripts:**
    *   `content.js`: Injects the widget into web pages.
    *   `widget.js`: Handles all widget logic (dragging, expand/collapse).
    *   `widget.css`: Provides the styling for the widget.

### 3.3. Widget Injection (`content.js`)

*   Responsible for creating the widget's HTML structure and injecting it into the DOM of the current page.
*   Loads the widget's last saved position from `chrome.storage.local`.

### 3.4. Widget Logic (`widget.js`)

*   Handles all user interactions with the widget.
*   Implements the drag-and-drop functionality.
*   Manages the expand and collapse behavior between the floating circle and the main panel.
*   Contains the logic for keeping the widget within the viewport.

### 3.5. Styling (`widget.css`)

*   Defines the visual appearance of the widget, including the glassmorphism effect, layout, and animations.
*   Uses `backdrop-filter: blur()` to create the blurred glass effect.

---

## 4. Future Enhancements

This section outlines potential features to be added in future versions.

*   **API Integration:** Connect the `Clarify` and `Concise` buttons to a language model API to provide prompt suggestions.
*   **Inline Text Highlighting:** Allow users to select text on a page and get suggestions directly.
*   **Prompt History:** Save a history of user prompts and suggestions.
*   **Customizable Themes:** Allow users to choose different themes or create their own.
