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

// Toggle expand/minimize
const circle = document.getElementById("floatingCircle");
const popup = document.getElementById("popup");
const minimizeBtn = document.getElementById("minimizeButton");

let isDragging = false;
let hasDragged = false;
let offsetX, offsetY;

circle.addEventListener("mousedown", (e) => {
  isDragging = true;
  hasDragged = false;
  offsetX = e.clientX - widgetContainer.getBoundingClientRect().left;
  offsetY = e.clientY - widgetContainer.getBoundingClientRect().top;
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
  isDragging = false;
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
});

