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
    widgetContainer.style.left = `${uiState.circleX}px`;
    widgetContainer.style.top = `${uiState.circleY}px`;
    widgetContainer.style.width = "60px";
    widgetContainer.style.height = "60px";
  } else {
    widgetContainer.classList.add("claryvyb-popup-view");
    widgetContainer.classList.remove("claryvyb-circle-view");
    widgetContainer.style.left = `${uiState.widgetX}px`;
    widgetContainer.style.top = `${uiState.widgetY}px`;
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
      <img src="${chrome.runtime.getURL('./icons/icon48.png')}" alt="ClaryVyb" />
      <button id="minimizeButton">&times;</button>
    </div>
    <textarea id="promptInput" placeholder="Enter your prompt..."></textarea>
    <div class="buttons">
      <button id="clarifyButton">Clarify</button>
      <button id="conciseButton">Concise</button>
      <button id="copyButton">Copy</button>
    </div>
    <div id="outputContainer"></div>
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
    widgetContainer.style.left = `${e.clientX - offsetX}px`;
    widgetContainer.style.top = `${e.clientY - offsetY}px`;
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
  saveUiState();
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
// SECTION: INITIALIZATION
// =====================================================================================

restoreUiState();
