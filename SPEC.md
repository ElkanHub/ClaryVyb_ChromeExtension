## ClaryVyb Chrome Extension – Technical Specification

---

### **Document Version:** 1.3

### **Last Updated:** 2025-08-27

---

## 1. Overview...

ClaryVyb is a Chrome extension designed to help users refine and improve their writing prompts for AI platforms. It provides a non-intrusive, on-page widget that allows for quick prompt clarification and simplification without disrupting the user's workflow.

The core of the extension is a draggable and resizable glassmorphic widget that can be expanded for prompt input or collapsed into a small, floating circle to save space. The widget is constrained to the visible screen area, ensuring it is always accessible.

A key feature is the **AI Platform Detection**, where the widget's floating circle glows to notify the user when they are on a known AI website. This glow can also be manually triggered via a keyboard shortcut.

---

## 2. Core Functionality

### 2.1. Draggable & Resizable Widget

The widget is the central UI component of the extension. It can be moved freely around the screen and resized to fit the user's needs. Its position and size are saved locally, so it remembers its state across sessions.

- **Screen Boundary Constraints:** The widget is always constrained to the visible screen area. It cannot be dragged or resized off-screen.

#### 2.1.1. Collapsed State (Floating Circle)

- **Appearance:** A 60x60px circular button with a semi-transparent, blurred background (glassmorphism).
- **Behavior:**
  - Displays the extension's logo or an initial.
  - Can be dragged and dropped anywhere on the screen.
  - A single click expands the widget into the full panel.

#### 2.1.2. Expanded State (Glass Panel)

- **Appearance:** A rectangular panel with a glassmorphic background.
- **Behavior:**
  - The panel is draggable by its header.
  - The panel is resizable from the bottom-right corner.
  - The panel has a minimum width of 400px and a maximum width of 600px.
  - The panel has a minimum height of 180px and a maximum height of 400px.
  - Clicking the minimize button collapses the panel back into the floating circle.
- **Components:**
  - **Header:** Contains the extension logo, title "ClaryVyb", and a minimize button.
  - **Prompt Input:** A textarea for users to enter their text.
  - **Action Buttons:**
    - `Clarify`: (API call placeholder) To make the prompt more detailed.
    - `Concise`: (API call placeholder) To make the prompt shorter.
    - `Copy`: To copy the output to the clipboard.
  - **Output Container:** A read-only area to display the refined prompt.

### 2.2. AI Platform Detection & Glow Effect

- **Automatic Detection:** The extension automatically detects when the user navigates to a known AI platform (e.g., `openai.com`, `claude.ai`).
- **Glow Notification:** When an AI platform is detected, the floating circle emits a "pulse glow" animation to subtly notify the user.
- **Manual Trigger:** Users can manually trigger the glow effect using the keyboard shortcut `Ctrl+Shift+K` (or `Command+Shift+K` on Mac).

### 2.3. Status Indicators

_This functionality is planned for future API integration._

- **In Progress:** When an API call is active, the floating circle will display a spinning progress animation and a yellow status badge.
- **Completed:** When the API call is finished, the spinner will stop, and the badge will turn green, indicating the output is ready.

---

## 3. Technical Implementation

### 3.1. File Structure

```
claryvyb-extension/
├── manifest.json
├── content.js
├── widget.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 3.2. Manifest (`manifest.json`)

- **Version:** Manifest V3
- **Permissions:** `storage`, `activeTab`, `scripting`
- **Content Scripts:**
  - `content.js`: Injects the widget and handles all its logic.
  - `widget.css`: Provides the styling for the widget.
- **Commands:**
  - `trigger-ai-glow`: Defines the `Ctrl+Shift+K` shortcut.

### 3.3. Widget Logic (`content.js`)

- **UI State Management:** The widget's state (position, size, and view) is managed by a `uiState` object. This object is saved to `chrome.storage.local` to persist the state across sessions.
- **View Switching:** The visibility of the circle and the popup is controlled by adding and removing the `claryvyb-circle-view` and `claryvyb-popup-view` classes to the main widget container.
- **Drag and Drop:** The drag and drop functionality is implemented for both the circle and the popup header.
- **Resizing:** The resizing functionality is implemented using a resize handle and a `ResizeObserver` to update the `uiState` object.
- **Boundary Constraints:** The `constrainWidgetPosition` helper function ensures that the widget stays within the visible screen area. This function is called during drag, resize, and expand operations. A `resize` event listener on the `window` object also ensures the widget stays within the boundaries when the window is resized.
- **AI Detection Logic:** The `isAiPlatform` function checks the current URL against a list of known AI domains. A `MutationObserver` is used to detect single-page application navigation.

### 3.4. Styling (`widget.css`)

- Defines the visual appearance of the widget, including the glassmorphism effect, layout, and animations.
- Uses `backdrop-filter: blur()` to create the blurred glass effect.
- Contains the `ai-glow` animation and styles for the progress spinner and status badges.

---

## 4. Future Enhancements

This section outlines potential features to be added in future versions.

- **API Integration:** Connect the `Clarify` and `Concise` buttons to a language model API to provide prompt suggestions.
- **Inline Text Highlighting:** Allow users to select text on a page and get suggestions directly.
- **Prompt History:** Save a history of user prompts and suggestions.
- **Customizable Themes:** Allow users to choose different themes or create their own.
