// This script will be responsible for injecting the widget into the page.// Create container
const widgetContainer = document.createElement("div");
widgetContainer.id = "claryvyb-widget";

// Start with just the floating circle
widgetContainer.innerHTML = `
  <div id="floatingCircle">
    <div class="progress-spinner"></div>
    <div class="badge"></div>
  </div>
  <div id="popup" class="glass hidden">
    <div class="header">
      <img src="${chrome.runtime.getURL("icons/icon48.png")}" alt="ClaryVyb" />
      <button id="minimizeButton">-</button>
    </div>
    <textarea id="promptInput" placeholder="Enter your prompt..."></textarea>
    <div class="buttons">
      <button id="clarifyButton">Clarify</button>
      <button id="conciseButton">Concise</button>
      <button id="copyButton">Copy</button>
    </div>
    <div id="outputContainer"></div>
  </div>
`;

document.body.appendChild(widgetContainer);

// Load widget position from storage
chrome.storage.local.get("widgetPosition", (data) => {
  if (data.widgetPosition) {
    widgetContainer.style.left = `${data.widgetPosition.left}px`;
    widgetContainer.style.top = `${data.widgetPosition.top}px`;
    widgetContainer.style.right = "auto";
    widgetContainer.style.bottom = "auto";
    widgetContainer.style.position = "fixed";
  }
});

// Toggle expand/minimize
const circle = document.getElementById("floatingCircle");
const popup = document.getElementById("popup");
const minimizeBtn = document.getElementById("minimizeButton");
const header = document.querySelector('#popup .header');

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
    widgetContainer.style.right = "auto";
    widgetContainer.style.bottom = "auto";
    widgetContainer.style.position = "fixed";
  }
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    widgetContainer.style.cursor = "default";
    const widgetRect = widgetContainer.getBoundingClientRect();
    chrome.storage.local.set({
      widgetPosition: { left: widgetRect.left, top: widgetRect.top },
    });
  }
});

circle.addEventListener("click", () => {
  if (hasDragged) {
    return;
  }

  // Show the popup first to get its dimensions
  popup.classList.remove("hidden");
  circle.style.display = "none";

  const widgetRect = widgetContainer.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let newLeft = widgetRect.left;
  let newTop = widgetRect.top;

  // Adjust horizontal position
  if (newLeft + popupRect.width > viewportWidth) {
    newLeft = viewportWidth - popupRect.width;
  }
  if (newLeft < 0) {
    newLeft = 0;
  }

  // Adjust vertical position
  if (newTop + popupRect.height > viewportHeight) {
    newTop = viewportHeight - popupRect.height;
  }
  if (newTop < 0) {
    newTop = 0;
  }

  // Apply the new position
  widgetContainer.style.left = `${newLeft}px`;
  widgetContainer.style.top = `${newTop}px`;
});

minimizeBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
    circle.style.display = "flex";
    //-------------
    chrome.storage.local.get("widgetPosition", (data) => {
        if (data.widgetPosition) {
            widgetContainer.style.left = `${data.widgetPosition.left}px`;
            widgetContainer.style.top = `${data.widgetPosition.top}px`;
            widgetContainer.style.right = "auto";
            widgetContainer.style.bottom = "auto";
            widgetContainer.style.position = "fixed";
        }
    });
});

