// This script will be responsible for injecting the widget into the page.

// =====================================================================================
// SECTION: UI STATE MANAGEMENT
// =====================================================================================

let uiState = {
  circleX: 20,
  circleY: 20,
  widgetX: 20,
  widgetY: 20,
  widgetWidth: 320,
  widgetHeight: 220,
  view: "circle", // can be 'circle' or 'popup'
};

function saveUiState() {
  chrome.storage.local.set({ uiState });
}

function restoreUiState(callback) {
  chrome.storage.local.get("uiState", (data) => {
    if (data.uiState) {
      uiState = data.uiState;
    }
    applyUiState();
    if (callback) callback();
  });
}

function applyUiState() {
  if (uiState.view === "circle") {
    widgetContainer.classList.add("claryvyb-circle-view");
    widgetContainer.classList.remove("claryvyb-popup-view");
    const { x, y } = constrainWidgetPosition(
      uiState.circleX,
      uiState.circleY,
      60,
      60
    );
    widgetContainer.style.left = `${x}px`;
    widgetContainer.style.top = `${y}px`;
    widgetContainer.style.width = "60px";
    widgetContainer.style.height = "60px";
  } else {
    widgetContainer.classList.add("claryvyb-popup-view");
    widgetContainer.classList.remove("claryvyb-circle-view");
    const { x, y } = constrainWidgetPosition(
      uiState.widgetX,
      uiState.widgetY,
      uiState.widgetWidth,
      uiState.widgetHeight
    );
    widgetContainer.style.left = `${x}px`;
    widgetContainer.style.top = `${y}px`;
    widgetContainer.style.width = `${uiState.widgetWidth}px`;
    widgetContainer.style.height = `${uiState.widgetHeight}px`;
  }
}

// =====================================================================================
// SECTION: WIDGET INJECTION
// =====================================================================================

const widgetContainer = document.createElement("div");
widgetContainer.id = "claryvyb-widget";

widgetContainer.innerHTML = `
  <div id="floatingCircle">
    <div class="progress-spinner"></div>
    <div class="badge"></div>
  </div>
  <div id="popup" class="glass">
    <div class="header">
      <img src="${chrome.runtime.getURL("icons/icon48.png")}" alt="ClaryVyb" />
      <span class="title">ClaryVyb</span>
      <button id="minimizeButton">&times;</button>
    </div>
    <textarea id="promptInput" placeholder="Enter your prompt..."></textarea>
    <div class="buttons">
      <button id="clarifyButton">Clarify</button>
      <button id="conciseButton">Concise</button>
      <button id="copyButton">Copy</button>
    </div>
    <div id="outputContainer">
      <p>
      Triadic Colors
Triadic harmonies consist of three colors equidistant from one another on the color wheel. Like complementary colors, triadic schemes tend to be very bright with a high contrast and work best when one color dominates.

Tetradic Colors
Tetradic color harmonies are formed by two sets of complementary colors 60 degrees apart on the color wheel. Tetradic schemes are an excellent starting point for creating color palettes; fine tune them using color shades, tints and tones.

Square Colors
Similar to tetradic harmonies, square color schemes consist of four colors, but set equidistant from one another on the color wheel. Likewise square harmonies are great beginnings of a brand or website color palette.

Color Shades, Tints and Tones
Color shades, tints and tones are created by adding black, white and gray respectively to a chosen color. They can be very useful in web design for backgrounds and typography, and are often paired with a complementary color for contrast.

Color Shades
      </p>
    </div>
    <div id="resizeHandle"></div>
  </div>
`;

document.body.appendChild(widgetContainer);

// =====================================================================================
// SECTION: UI ELEMENT REFERENCES
// =====================================================================================

const circle = document.getElementById("floatingCircle");
const popup = document.getElementById("popup");
const minimizeBtn = document.getElementById("minimizeButton");
const header = document.querySelector("#popup .header");
const resizeHandle = document.getElementById("resizeHandle");

// =====================================================================================
// SECTION: HELPER FUNCTIONS
// =====================================================================================

function constrainWidgetPosition(x, y, width, height) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let newX = x;
  let newY = y;

  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  if (newX + width > viewportWidth) newX = viewportWidth - width;
  if (newY + height > viewportHeight) newY = viewportHeight - height;

  return { x: newX, y: newY };
}

// =====================================================================================
// SECTION: DRAG AND DROP LOGIC
// =====================================================================================

let isDragging = false;
let hasDragged = false;
let offsetX, offsetY;

function startDrag(e) {
  isDragging = true;
  hasDragged = false;
  offsetX = e.clientX - widgetContainer.getBoundingClientRect().left;
  offsetY = e.clientY - widgetContainer.getBoundingClientRect().top;
  widgetContainer.style.cursor = "grabbing";
}

circle.addEventListener("mousedown", (e) => {
  e.preventDefault();
  startDrag(e);
});

header.addEventListener("mousedown", (e) => {
  e.preventDefault();
  startDrag(e);
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    hasDragged = true;
    const { x, y } = constrainWidgetPosition(
      e.clientX - offsetX,
      e.clientY - offsetY,
      widgetContainer.offsetWidth,
      widgetContainer.offsetHeight
    );
    widgetContainer.style.left = `${x}px`;
    widgetContainer.style.top = `${y}px`;
  }
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    widgetContainer.style.cursor = "default";
    if (uiState.view === "circle") {
      uiState.circleX = parseInt(widgetContainer.style.left);
      uiState.circleY = parseInt(widgetContainer.style.top);
    } else {
      uiState.widgetX = parseInt(widgetContainer.style.left);
      uiState.widgetY = parseInt(widgetContainer.style.top);
    }
    saveUiState();
  }
});

// =====================================================================================
// SECTION: RESIZE LOGIC
// =====================================================================================

const resizeObserver = new ResizeObserver(() => {
  uiState.widgetWidth = popup.offsetWidth;
  uiState.widgetHeight = popup.offsetHeight;
  const { x, y } = constrainWidgetPosition(
    uiState.widgetX,
    uiState.widgetY,
    uiState.widgetWidth,
    uiState.widgetHeight
  );
  uiState.widgetX = x;
  uiState.widgetY = y;
  saveUiState();
  applyUiState();
});
resizeObserver.observe(popup);

// =====================================================================================
// SECTION: WIDGET EXPAND/COLLAPSE LOGIC
// =====================================================================================

circle.addEventListener("click", () => {
  if (hasDragged) {
    return;
  }
  uiState.view = "popup";
  applyUiState();
  saveUiState();
});

minimizeBtn.addEventListener("click", () => {
  uiState.view = "circle";
  applyUiState();
  saveUiState();
});

// =====================================================================================
// SECTION: WINDOW RESIZE HANDLING
// =====================================================================================

window.addEventListener("resize", () => {
  applyUiState();
});

// =====================================================================================
// SECTION: INITIALIZATION
// =====================================================================================

restoreUiState();

//===========================
const knownAiDomains = [
  "openai.com",
  "chat.openai.com",
  "claude.ai",
  "perplexity.ai",
  "character.ai",
  "stability.ai",
  "midjourney.com",
  "huggingface.co",
  "runwayml.com",
  "bard.google.com",
  "gemini.google.com",
  "bing.com",
  "lovable.dev",
  "bolt.new",
];

function isAiPlatform(url) {
  try {
    const parsed = new URL(url);

    // Exact domain match
    if (knownAiDomains.some((domain) => parsed.hostname.includes(domain))) {
      return true;
    }
    // Contains domain name
    if (knownAiDomains.some((domain) => parsed.includes(domain))) {
      return true;
    }

    // Heuristic: contains .ai or path with "ai"
    if (parsed.hostname.endsWith(".ai") || parsed.pathname.includes("/ai")) {
      return true;
    }
  } catch (e) {
    console.error("Invalid URL", e);
  }
  return false;
}
//2============================
function triggerAiGlow() {
  const circle = document.getElementById("floatingCircle");
  if (!circle) return;

  circle.classList.add("ai-glow");

  // remove after animation ends so it can be triggered again later
  circle.addEventListener(
    "animationend",
    () => {
      circle.classList.remove("ai-glow");
    },
    { once: true }
  );
}
//3=================
function checkAiAndGlow() {
  if (isAiPlatform(window.location.href)) {
    triggerAiGlow();
  }
}

// Run once on load
checkAiAndGlow();

// Also catch SPA navigation (sites that don’t fully reload)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkAiAndGlow();
  }
}).observe(document, { subtree: true, childList: true });

//4=================glow on keypress
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "l") {
    triggerAiGlow();
  }
});
