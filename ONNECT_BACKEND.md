ClaryVyb Extension — Implementation Architecture & Instructions (for Gemini)

Goal: implement secure, robust extension behaviour that integrates with your backend (MVP endpoints), enforces auth gating of the prompt UI, supports login/signup via a single toggling button, allows updating/deleting API keys, shows footer messages, and securely stores tokens and API keys.

Summary of responsibilities

Background Service Worker (background.js) — token lifecycle, secure storage, fetch wrapper, all network calls, encryption utilities, message router, refresh flow, logout token revocation.

Content Script / Widget (content.js) — UI: floating circle, popup, forms, prompt interface, footer messages, drag/resize; forwards user actions to the background worker via chrome.runtime.sendMessage and listens for responses; never performs direct network fetches or reads raw tokens.

Popup / Options (optional) — not required; everything runs within injected widget.

Storage keys (chrome.storage.local)

Use these exact keys for clarity:

clary:refreshToken — string (refresh token), encrypted (see encryption below).

clary:refreshTokenMeta — { createdAt, expiry } (plain JSON).

clary:installSecret — ArrayBuffer / base64 raw crypto key export used to encrypt sensitive values (generated once on install).

clary:uiState — JSON (your existing UI state object).

clary:userProfile — { email, createdAt, updatedAt } (non-sensitive user info).

clary:encryptedGroqKey — string (AES-GCM encrypted Groq API key).

clary:settings — optional flags.

Note: Do NOT store accessToken in chrome.storage.local. Access token is in-memory only in background worker.

Token strategy (recommended secure flow)

Recommended (secure, slightly more work):

Backend issues:

accessToken (short-lived, e.g. 15–60 minutes)

refreshToken (long-lived, e.g. 7 days)

Background service worker stores refreshToken encrypted (clary:refreshToken) and keeps accessToken in-memory.

For each API call background attaches Authorization: Bearer <accessToken>.

On 401, background calls POST /api/auth/refresh (if backend supports) with refreshToken to obtain new tokens. If refresh fails → force logout.

Fallback (if backend only returns a single JWT):

Treat returned JWT as accessToken and store it encrypted in clary:refreshToken (so it survives restarts). Background will use it for requests. On 401 or expiry, force re-login.

Implement refresh logic but make it conditional: if /api/auth/refresh exists, use it; otherwise fall back to single-JWT flow.

Encryption (Web Crypto)

Purpose: encrypt refresh token and Groq API key in storage.

On first install, background runs generateInstallSecret():

crypto.subtle.generateKey({name: "AES-GCM", length: 256}, true, ["encrypt","decrypt"])

crypto.subtle.exportKey("raw", key) → store base64 as clary:installSecret.

Use AES-GCM with 12-byte random IV per encryption.

encrypt(plaintext) returns base64 { iv, ciphertext }.

decrypt(base64Payload) reverses.

Why: It protects tokens/API keys at rest in extension storage. (Not perfect against full-host compromise, but acceptable practice.)

Background Service Worker — responsibilities & implementation details

File: background.js (register as service_worker in manifest v3)

Major functions

init()

Ensure installSecret exists → if not, generate and store it.

Restore any encrypted refreshToken and decrypt into memory variable refreshTokenEncrypted. Do not set accessToken until login.

login({email, password, apiKey})

POST /api/auth/login with credentials (if signup mode, use /api/auth/register).

On success: expect { accessToken, refreshToken, user } or single { token } (handle fallback).

Save accessToken in memory. Save refreshToken encrypted to clary:refreshToken. Save userProfile to clary:userProfile. Respond to content with success or error.

signup({email, password, apiKey})

POST /api/auth/register with body {email,password} (if your backend supports sending API key at signup, include; otherwise call PUT /api/user/apikey after signup+login).

On success same as login.

logout()

If backend logout endpoint exists: call POST /api/auth/logout with current access token in header.

Delete clary:refreshToken, clary:userProfile, clary:encryptedGroqKey from storage. Clear in-memory access token. Send success back. (Also instruct content to switch to login view.)

refreshAccessToken()

If backend supports POST /api/auth/refresh → POST with decrypted refresh token. On success update in-memory access token and encrypted refresh token. Return true/false.

fetchWithAuth(url, options) — central wrapper used for all API calls to backend and Groq forwarding:

Ensure accessToken present; attach header Authorization: Bearer ${accessToken}.

Make fetch. If status 401 → call refreshAccessToken(); if refresh succeeds, retry original request; else return 401 error to content (force logout).

All fetches to your backend go to https://your.api.host/... (use env variable in build).

For security, ensure mode: 'cors', credentials: 'omit' (we're using bearer tokens).

userApiKeySave(apiKeyPlain)

Encrypt apiKeyPlain with background crypto, store clary:encryptedGroqKey.

Call backend PUT /api/user/apikey via fetchWithAuth with body { apiKey: apiKeyPlain } — backend will again encrypt server-side; your storage is client-side encrypted. Return result.

userApiKeyDelete()

Call DELETE /api/user/apikey via fetchWithAuth. Delete local clary:encryptedGroqKey.

handlePrompt(type, input) (type = 'clarify' | 'concise')

Build body: { input } and call POST /api/prompt/${type} via fetchWithAuth.

On success return { output } to content for display.

messageRouter(request, sender, sendResponse)

All messages from content use action names: login, signup, logout, saveApiKey, deleteApiKey, getProfile, promptClarify, promptConcise, getUiState, setUiState.

Return Promises using sendResponse and return true for async.

Storage & memory variables (background)

let accessToken = null; // in-memory only

let refreshTokenPlain = null; // only when necessary during refresh; otherwise read/decrypt for refresh call

Use chrome.storage.local to persist encrypted refresh token and encrypted Groq key.

Content Script / Widget — responsibilities & exact message flows

File: content.js (the script you already provided; update with message calls instead of direct fetches)

UI behaviour rules (exact)

Single auth button behavior

Button acts as submit for either Login or Signup depending on authMode state: 'login' | 'signup'.

Under the form show a clickable text link Create a new account that toggles authMode between login/signup and changes button label accordingly.

For signup show inputs: email, password, apiKey (APIKEY optional if backend supports later save). Under the apiKey field show link How to get an API key → open external doc in new tab chrome.tabs.create({ url }).

On submit: content sends chrome.runtime.sendMessage({ action: authMode === 'login' ? 'login' : 'signup', body: { email, password, apiKey } }, callback)

Prompt UI gating

On load, content asks background for getProfile or checkAuth message: chrome.runtime.sendMessage({ action: 'getProfile' }, response => {...}).

If not authenticated -> show login view (uiState.view = 'login'); hide prompt interface.

If authenticated -> show prompt interface and two extra buttons: Update API and Logout (beside Clarify, Concise, Copy).

The prompt interface is locked until background confirms auth.

Update API Key flow

Clicking Update API shows a small inline form with one input apiKey and a Submit button, replacing the prompt UI temporarily. Provide a Cancel button to go back.

On submit: send message chrome.runtime.sendMessage({ action: 'saveApiKey', body: { apiKey }}).

Background responds success/failure → content shows message in footer.

Logout

Clicking Logout triggers chrome.runtime.sendMessage({ action: 'logout' }).

On success, content clears prompt output, returns to login view, and sets uiState accordingly.

Footer messaging

The footer (existing area) displays default: Learn More about ClaryVyb (link).

On any background response message with {status:'ok'|'error', message:'...'}, update the footer text for 5 seconds and then revert to default. Use consistent call: displayFooterMsg(text, type).

Prompt buttons

Clarify and Concise: on click send chrome.runtime.sendMessage({ action: 'promptClarify'|'promptConcise', body: { input: promptInput.value }}). Disable buttons while waiting. When response arrives, show output in #outputContainer.

Copy: copies #outputContainer innerText to clipboard using navigator.clipboard.writeText.

UI state persistence

Keep the existing saveUiState()/restoreUiState() logic. Also persist last view (login vs prompt) only after auth success.

Do not read tokens or encrypted keys from chrome.storage in content script. All sensitive operations must go through background.

Message formats (exact)

login:

{ action: 'login', body: { email, password, apiKey? } }


response:

{ status: 'ok', user: { email, createdAt }, message: '...' }
// or
{ status: 'error', message: 'Invalid credentials' }


signup: same as login.

logout:

{ action: 'logout' }


response { status: 'ok' } or error.

saveApiKey:

{ action: 'saveApiKey', body: { apiKey } }


response { status:'ok', message:'API key saved' }.

deleteApiKey: similar.

getProfile:

{ action: 'getProfile' }


response { status:'ok', user:{email, createdAt}} or {status:'unauthenticated'}.

promptClarify / promptConcise:

{ action: 'promptClarify', body: { input } }


response:

{ status:'ok', output: '...' } or { status:'error', message:'...' }

API endpoints & exact fetch usage (background must call these)

(Use base URL set in manifest or as build-time constant.)

POST /api/auth/register

Body: { email, password } (if you want to include API key at sign-up, include apiKey optional).

Response: { user, accessToken, refreshToken } or { token } fallback.

POST /api/auth/login

Body: { email, password }

Response same as register.

POST /api/auth/logout

Header: Authorization: Bearer <accessToken>

Body: none. Response { success: true }.

POST /api/auth/refresh (optional)

Body: { refreshToken } OR send refresh token via header per your backend. Response new tokens.

GET /api/user/profile

Header: Authorization. Response { email, createdAt, updatedAt }.

PUT /api/user/apikey

Header: Authorization. Body: { apiKey }. Response { success }.

DELETE /api/user/apikey

Header: Authorization. Response { success }.

POST /api/prompt/clarify

Header: Authorization. Body: { input } Response { output }.

POST /api/prompt/concise

Header: Authorization. Body: { input } Response { output }.

All requests use JSON Content-Type: application/json.

Background — example pseudo-code skeleton (must be implemented)
// background.js
let accessToken = null;
let refreshTokenEncrypted = null;
let installSecret = null;

async function init() {
  installSecret = await getOrCreateInstallSecret();
  refreshTokenEncrypted = await chrome.storage.local.get('clary:refreshToken');
  if (refreshTokenEncrypted?.['clary:refreshToken']) {
    // keep encrypted in storage, do not set accessToken
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch(msg.action) {
    case 'login': handleLogin(msg.body).then(sendResponse); break;
    case 'signup': handleSignup(msg.body).then(sendResponse); break;
    case 'logout': handleLogout().then(sendResponse); break;
    case 'getProfile': getProfile().then(sendResponse); break;
    case 'saveApiKey': saveApiKey(msg.body.apiKey).then(sendResponse); break;
    case 'promptClarify': handlePrompt('clarify', msg.body.input).then(sendResponse); break;
    // ...
  }
  return true; // keep channel open
});

async function fetchWithAuth(url, opts = {}) {
  if (!accessToken) {
    // try to refresh (if possible) or return unauthenticated
    const ok = await attemptRefresh();
    if (!ok) throw { status:401 };
  }
  opts.headers = opts.headers || {};
  opts.headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(url, opts);
  if (res.status === 401) {
    if (await attemptRefresh()) {
      opts.headers['Authorization'] = `Bearer ${accessToken}`;
      return fetch(url, opts);
    } else {
      throw { status:401 };
    }
  }
  return res;
}


(Implement encryption helpers encryptString, decryptString using SubtleCrypto and store base64.)

Content script changes (exact)

Replace any direct fetch() calls with chrome.runtime.sendMessage() to background actions listed above.

On initialization, call chrome.runtime.sendMessage({ action: 'getProfile' }, resp => { if (resp.status==='ok') showPromptUI(); else showLoginUI(); }).

Implement UI toggles as described; keep existing drag/resize code.

Show footer messages by listening to responses and calling displayFooterMsg().

Error handling & UX details (must be implemented exactly)

All network errors: background returns { status: 'error', message }. Content displays message in footer as red for 5s.

Success messages: green for 5s.

Unauthorized: if any response indicates 401 or unauthenticated, background forces logout and notifies content to show login view with footer message: Session expired — please log in again.

Button disable states: while awaiting background responses for login/signup/prompt, disable the submit buttons and show spinner on the floating circle.

Testing checklist (required before release)

Fresh install → open extension → login screen appears.

Signup flow: create account + provide API key (if applicable) → success → check prompting screen unlocked.

Login flow with existing user → success.

Save API key flow → saved to storage (encrypted) and backend PUT returns OK.

Prompt clarify/concise → returns output, correct UI rendering.

Logout → calls backend, clears storage, returns to login.

Token expiry simulation → attempt request with expired access token; background attempts refresh; if refresh fails user is logged out.

Content scripts cannot read storage keys directly; only background has them.

Verify footer messages for success and error.

UI drag/resize persist across reloads.

Security hardening notes (do exactly)

Content must never expose accessToken or refreshToken. Only background handles tokens.

Avoid injecting any eval() or exposing global functions that can be hijacked by page scripts. Use unique element IDs and shadow DOM if desired.

Use chrome.runtime.id for icon URLs and assets.

Use chrome.storage.local quotas carefully; encrypted payloads are small.

In background, limit logging of token values. Never log tokens or API keys.

Deliverables for Gemini (exact)

Implement these files/changes (structure):

/extension
  /manifest.json (v3)
  /background.js         // service worker - full token + fetch logic
  /content.js            // your existing widget script updated to message the background
  /ui.css
  /icons/ClaryVybLogo48.png
  /utils/crypto.js       // subtleCrypto helpers used by background
  /utils/messages.js     // message action constants


Include inline comments in background.js separating sections:

// === CRYPTO / STORAGE HELPERS ===

// === AUTH FLOW HANDLERS ===

// === FETCH WRAPPER ===

// === MESSAGE ROUTER ===

Include inline comments in content.js separating:

// === UI STATE MANAGEMENT ===

// === AUTH UI LOGIC (login/signup toggle) ===

// === PROMPT UI LOGIC ===

// === FOOTER MESSAGE HANDLING ===

// === MESSAGE PASSING TO BACKGROUND ===

Final notes / fallback behaviour

If backend does not provide /api/auth/refresh, the implementation should fallback to storing the single JWT encrypted in storage[which is applicable in the case of our backend so implement with this in mind], load it on start (decrypt), set it as accessToken in-memory and behave as if it is the access token. If 401 occurs and no refresh endpoint exists → force logout and prompt user to re-login (do not attempt refresh loops).