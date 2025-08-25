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

circle.addEventListener("click", () => {
  popup.classList.remove("hidden");
  circle.style.display = "none";
});

minimizeBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
  circle.style.display = "flex";
});



//--------------
let isDragging = false;
let offsetX, offsetY;

circle.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - circle.getBoundingClientRect().left;
  offsetY = e.clientY - circle.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    circle.style.left = `${e.clientX - offsetX}px`;
    circle.style.top = `${e.clientY - offsetY}px`;
    circle.style.right = "auto"; // reset fixed right
    circle.style.bottom = "auto"; // reset fixed bottom
    circle.style.position = "fixed";
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

