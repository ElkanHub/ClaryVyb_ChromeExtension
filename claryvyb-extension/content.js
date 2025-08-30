// =====================================================================================
// SECTION: IMPORTS & INITIALIZATION
// =====================================================================================

// The MSG object is not directly imported because content scripts run in an isolated world.
// We will define the constants directly or use strings, and the background script will use the imported module.
const MSG = {
  LOGIN: "login",
  SIGNUP: "signup",
  LOGOUT: "logout",
  CHECK_AUTH: "checkAuth",
  GET_PROFILE: "getProfile",
  SAVE_API_KEY: "saveApiKey",
  DELETE_API_KEY: "deleteApiKey",
  PROMPT_CLARIFY: "promptClarify",
  PROMPT_CONCISE: "promptConcise",
  GET_UI_STATE: "getUiState",
  SET_UI_STATE: "setUiState",
  OPEN_EXTERNAL_URL: "openExternalUrl",
};

// =====================================================================================
// SECTION: UI STATE MANAGEMENT
// =====================================================================================

let uiState = {
  circleX: 20,
  circleY: 20,
  widgetX: 20,
  widgetY: 20,
  widgetWidth: 360, // Increased width for auth forms
  widgetHeight: 480, // Increased height for auth forms
  view: "circle", // 'circle', 'popup', or 'login'
  authMode: "login", // 'login' or 'signup'
};

function saveUiState() {
  // Use message passing to save UI state in the background script
  chrome.runtime.sendMessage({ action: MSG.SET_UI_STATE, body: uiState });
}

function restoreUiState(callback) {
  // Request UI state from the background script
  chrome.runtime.sendMessage({ action: MSG.GET_UI_STATE }, (data) => {
    if (data && Object.keys(data).length > 0) {
      uiState = { ...uiState, ...data };
    }
    applyUiState();
    if (callback) callback();
  });
}

function applyUiState() {
  const isPopup = uiState.view === "popup" || uiState.view === "login";

  widgetContainer.style.position = "fixed";
  widgetContainer.style.zIndex = "999999999999999999999";

  if (!isPopup) {
    // Circle view
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
    // Popup or Login view
    widgetContainer.classList.remove("claryvyb-circle-view");
    widgetContainer.classList.add("claryvyb-popup-view");
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

  // Toggle visibility of different views inside the popup
  authView.style.display = uiState.view === "login" ? "flex" : "none";
  promptView.style.display = uiState.view === "popup" ? "flex" : "none";
}

// =====================================================================================
// SECTION: WIDGET INJECTION
// =====================================================================================

const widgetContainer = document.createElement("div");
widgetContainer.id = "claryvyb-widget";

// Updated innerHTML with Auth and Prompt views
widgetContainer.innerHTML = `
  <div id="floatingCircle">
    <div class="progress-spinner"></div>
    <div class="badge"></div>
  </div>

  <div id="popup" class="glass">
    <div class="header">
      <img src="${chrome.runtime.getURL(
        "icons/ClaryVybLogo48.png"
      )}" alt="ClaryVyb" />
      <span class="title">ClaryVyb</span>
      <button id="minimizeButton">&times;</button>
    </div>

    <!-- Authentication View -->
    <div id="authView" style="display: none;">
      <h3 id="authTitle">Login</h3>
      <input type="email" id="emailInput" placeholder="Email" autocomplete="email">
      <input type="password" id="passwordInput" placeholder="Password" autocomplete="current-password">
      <input type="text" id="apiKeyInput" placeholder="Groq API Key (Optional)" style="display: none;">
      <a href="#" id="apiKeyLink" target="_blank" style="display: none;">How to get an API key?</a>
      <button id="authButton">Login</button>
      <p id="authToggleText">No account? <a href="#" id="authToggleButton">Create one</a></p>
    </div>

    <!-- Prompt View -->
    <div id="promptView" style="display: none;">
      <textarea id="promptInput" placeholder="Enter your prompt..."></textarea>
      <div class="buttons">
        <button id="clarifyButton">Clarify</button>
        <button id="conciseButton">Concise</button>
        <button id="copyButton">Copy</button>
        <button id="logoutButton" class="secondary-button">Logout</button>
      </div>
       <div id="outputContainer">
         <p>
           Start by entering a prompt above and click Clarify or Concise.<a href="https://claryvyb.com" target="_blank">Click here to learn more about ClaryVyb</a>
         </p>
       </div>
    </div>
    
    <div class="footer">
        <span id="footerMessage"></span>
        <a href="#" id="updateApiKeyButton" style="display: none;">Update API Key</a>
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

// --- View Containers ---
const authView = document.getElementById("authView");
const promptView = document.getElementById("promptView");

// --- Auth Elements ---
const authTitle = document.getElementById("authTitle");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const apiKeyLink = document.getElementById("apiKeyLink");
const authButton = document.getElementById("authButton");
const authToggleText = document.getElementById("authToggleText");
const authToggleButton = document.getElementById("authToggleButton");

// --- Prompt Elements ---
const promptInput = document.getElementById("promptInput");
const clarifyButton = document.getElementById("clarifyButton");
const conciseButton = document.getElementById("conciseButton");
const copyButton = document.getElementById("copyButton");
const logoutButton = document.getElementById("logoutButton");
const outputContainer = document.getElementById("outputContainer");

// --- Footer Elements ---
const footerMessage = document.getElementById("footerMessage");
const updateApiKeyButton = document.getElementById("updateApiKeyButton");

// =====================================================================================
// SECTION: MESSAGE PASSING TO BACKGROUND
// =====================================================================================

/**
 * Sends a message to the background script and returns a promise with the response.
 * @param {string} action The message action (from MSG constants).
 * @param {object} body The message payload.
 * @returns {Promise<any>}
 */
function sendMessage(action, body = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, body }, resolve);
  });
}

// =====================================================================================
// SECTION: FOOTER MESSAGE HANDLING
// =====================================================================================

function displayFooterMsg(text, type = "info", duration = 5000) {
  footerMessage.textContent = text;
  footerMessage.className = `footer-message ${type}`;
  if (duration > 0) {
    setTimeout(() => {
      footerMessage.textContent = "";
      footerMessage.className = "footer-message";
    }, duration);
  }
}

// =====================================================================================
// SECTION: AUTH UI LOGIC
// =====================================================================================

function toggleAuthMode(mode) {
  uiState.authMode = mode;
  if (mode === "signup") {
    authTitle.textContent = "Create Account";
    authButton.textContent = "Sign Up";
    apiKeyInput.style.display = "block";
    apiKeyLink.style.display = "block";
    authToggleText.innerHTML = `Already have an account? <a href="#" id="authToggleButton">Login</a>`;
  } else {
    authTitle.textContent = "Login";
    authButton.textContent = "Login";
    apiKeyInput.style.display = "none";
    apiKeyLink.style.display = "none";
    authToggleText.innerHTML = `No account? <a href="#" id="authToggleButton">Create one</a>`;
  }
  // Re-add the event listener to the new toggle button
  document.getElementById("authToggleButton").addEventListener("click", (e) => {
    e.preventDefault();
    toggleAuthMode(uiState.authMode === "login" ? "signup" : "login");
  });
}

authToggleButton.addEventListener("click", (e) => {
  e.preventDefault();
  toggleAuthMode(uiState.authMode === "login" ? "signup" : "login");
});

authButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!email || !password) {
    return displayFooterMsg("Email and password are required.", "error");
  }

  authButton.disabled = true;
  authButton.textContent = "...";

  const action = uiState.authMode === "login" ? MSG.LOGIN : MSG.SIGNUP;
  const body = { email, password };
  if (uiState.authMode === "signup" && apiKey) {
    body.apiKey = apiKey;
  }

  const response = await sendMessage(action, body);

  if (response.status === "ok") {
    displayFooterMsg(response.message, "success");
    showPromptView();
  } else {
    displayFooterMsg(response.message || "Authentication failed.", "error");
  }

  authButton.disabled = false;
  toggleAuthMode(uiState.authMode); // Reset button text
});

logoutButton.addEventListener("click", async () => {
  const response = await sendMessage(MSG.LOGOUT);
  if (response.status === "ok") {
    displayFooterMsg("Logged out successfully.", "success");
    showLoginView();
  } else {
    displayFooterMsg(response.message || "Logout failed.", "error");
  }
});

// =====================================================================================
// SECTION: VIEW MANAGEMENT
// =====================================================================================

function showLoginView() {
  uiState.view = "login";
  applyUiState();
  saveUiState();
  updateApiKeyButton.style.display = "none";
}

async function showPromptView() {
  uiState.view = "popup";
  applyUiState();
  saveUiState();
  updateApiKeyButton.style.display = "block";
  // Fetch user profile to ensure UI is up-to-date
  const response = await sendMessage(MSG.GET_PROFILE);
  if (response.status === "ok") {
    // You could display user info here if needed
  } else if (response.status === "unauthenticated") {
    displayFooterMsg("Session expired. Please log in.", "error");
    showLoginView();
  }
}

// =====================================================================================
// SECTION: API KEY & PROMPT UI LOGIC
// =====================================================================================

clarifyButton.addEventListener("click", () => handlePrompt(MSG.PROMPT_CLARIFY));
conciseButton.addEventListener("click", () => handlePrompt(MSG.PROMPT_CONCISE));

async function handlePrompt(action) {
  const input = promptInput.value.trim();
  if (!input) {
    return displayFooterMsg("Please enter a prompt.", "error");
  }

  clarifyButton.disabled = true;
  conciseButton.disabled = true;
  outputContainer.innerHTML = '<div class="spinner"></div>'; // Show spinner

  const response = await sendMessage(action, { input });

  if (response.status === "ok") {
    outputContainer.innerHTML = `<p>${response.output}</p>`;
  } else {
    displayFooterMsg(response.message || "An error occurred.", "error");
    outputContainer.innerHTML = "<p>Error. Please try again.</p>";
  }

  clarifyButton.disabled = false;
  conciseButton.disabled = false;
}

copyButton.addEventListener("click", () => {
  navigator.clipboard
    .writeText(outputContainer.innerText)
    .then(() => displayFooterMsg("Copied to clipboard!", "success"))
    .catch(() => displayFooterMsg("Failed to copy.", "error"));
});

apiKeyLink.addEventListener("click", (e) => {
  e.preventDefault();
  sendMessage(MSG.OPEN_EXTERNAL_URL, { url: "https://console.groq.com/keys" });
});

updateApiKeyButton.addEventListener("click", async (e) => {
  e.preventDefault();
  const newApiKey = prompt("Please enter your new Groq API key:");
  if (newApiKey && newApiKey.trim()) {
    const response = await sendMessage(MSG.SAVE_API_KEY, {
      apiKey: newApiKey.trim(),
    });
    if (response.status === "ok") {
      displayFooterMsg("API key updated successfully!", "success");
    } else {
      displayFooterMsg(
        response.message || "Failed to update API key.",
        "error"
      );
    }
  }
});

// =====================================================================================
// SECTION: DRAG, RESIZE, AND EXPAND/COLLAPSE LOGIC (Existing Logic)
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
  if (e.target.id === "minimizeButton") return;
  e.preventDefault();
  startDrag(e);
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    hasDragged = true;
    const width = widgetContainer.offsetWidth;
    const height = widgetContainer.offsetHeight;
    const { x, y } = constrainWidgetPosition(
      e.clientX - offsetX,
      e.clientY - offsetY,
      width,
      height
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

const resizeObserver = new ResizeObserver(() => {
  if (uiState.view !== "popup" && uiState.view !== "login") return;
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

circle.addEventListener("click", async () => {
  if (hasDragged) return;
  // Check auth status before opening the popup
  const response = await sendMessage(MSG.CHECK_AUTH);
  if (response.status === "authenticated") {
    showPromptView();
  } else {
    showLoginView();
  }
});

minimizeBtn.addEventListener("click", () => {
  uiState.view = "circle";
  applyUiState();
  saveUiState();
});

function constrainWidgetPosition(x, y, width, height) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let newX = Math.max(0, x);
  let newY = Math.max(0, y);
  if (newX + width > viewportWidth) newX = viewportWidth - width;
  if (newY + height > viewportHeight) newY = viewportHeight - height;
  return { x: newX, y: newY };
}

window.addEventListener("resize", () => {
  applyUiState();
});

// =====================================================================================
// SECTION: INITIALIZATION
// =====================================================================================

async function initialize() {
  widgetContainer.style.display = "none";
  await new Promise((resolve) => restoreUiState(resolve));
  // After restoring state, check authentication to ensure the correct view is shown.
  const response = await sendMessage(MSG.CHECK_AUTH);
  if (response.status === "authenticated") {
    // If authenticated but the UI state is stuck on login, switch to prompt view.
    if (uiState.view === "login") {
      showPromptView();
    }
  } else {
    // If not authenticated, always force the login view.
    showLoginView();
  }
  widgetContainer.style.display = "block";
}

initialize();

//===========================
// Existing AI Glow effect logic (no changes needed here)
//===========================
const knownAiDomains = [
  "openai.com",
  "chat.openai.com",
  "chatgpt.com",
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
  "studio.firebase.google.com",
  "sora.chatgpt.com",
];

function isAiPlatform(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    return (
      knownAiDomains.some((domain) => host.includes(domain)) ||
      host.endsWith(".ai") ||
      path.includes("/ai")
    );
  } catch (e) {
    return false;
  }
}

function triggerAiGlow() {
  if (!circle) return;
  circle.classList.add("ai-glow");
  circle.addEventListener(
    "animationend",
    () => circle.classList.remove("ai-glow"),
    { once: true }
  );
}

function checkAiAndGlow() {
  if (isAiPlatform(window.location.href)) {
    triggerAiGlow();
  }
}

checkAiAndGlow();

let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    checkAiAndGlow();
  }
}).observe(document, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "trigger-ai-glow") {
    triggerAiGlow();
  }
});
