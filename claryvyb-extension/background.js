
// =================================================================================
// SECTION: IMPORTS & INITIALIZATION
// =================================================================================

import { MSG } from './utils/messages.js';
import { getOrCreateInstallSecret, encryptString, decryptString } from './utils/crypto.js';

// --- Constants ---
const API_BASE_URL = 'http://localhost:5000/api'; // Replace with your actual backend URL

// --- In-Memory State ---
// NOTE: Access tokens are kept in memory for security. They are short-lived and fetched
// or refreshed upon extension startup or when needed.
let accessToken = null;
let installSecret = null; // The master key for encrypting stored data, loaded on startup.

// =================================================================================
// SECTION: LIFECYCLE & INITIALIZATION
// =================================================================================

// Fired when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('ClaryVyb extension installed.');
    // Pre-generate the master encryption key on installation.
    await getOrCreateInstallSecret();
  }
  // Initialize the background service worker state.
  await init();
});

// Fired when the browser starts up.
chrome.runtime.onStartup.addListener(async () => {
  await init();
});

/**
 * Initializes the background service worker.
 * - Loads the master encryption key.
 * - Attempts to load and decrypt a stored token to establish an authenticated session.
 */
async function init() {
  console.log('Background service worker initializing...');
  installSecret = await getOrCreateInstallSecret();

  // On startup, try to load the stored token and set the in-memory access token.
  const token = await getStoredToken();
  if (token) {
    accessToken = token;
    console.log('Session restored from stored token.');
  } else {
    console.log('No active session found.');
  }
}

// =================================================================================
// SECTION: CRYPTO & STORAGE HELPERS
// =================================================================================

/**
 * Securely stores the authentication token in chrome.storage.local, encrypted.
 * @param {string} token The token to store.
 */
async function storeToken(token) {
  if (!installSecret) {
    throw new Error('Encryption key not available.');
  }
  const encryptedToken = await encryptString(token, installSecret);
  await chrome.storage.local.set({ 'clary:token': encryptedToken });
}

/**
 * Retrieves and decrypts the authentication token from chrome.storage.local.
 * @returns {Promise<string|null>} The decrypted token, or null if not found or decryption fails.
 */
async function getStoredToken() {
  if (!installSecret) {
    installSecret = await getOrCreateInstallSecret();
  }
  const result = await chrome.storage.local.get('clary:token');
  const encryptedToken = result['clary:token'];

  if (encryptedToken) {
    try {
      return await decryptString(encryptedToken, installSecret);
    } catch (error) {
      console.error('Failed to decrypt stored token. Clearing it.', error);
      // If decryption fails, the token is corrupt or the key changed. Clear it.
      await chrome.storage.local.remove('clary:token');
      return null;
    }
  }
  return null;
}

/**
 * Clears all authentication-related data from storage and memory.
 */
async function clearAuthData() {
  accessToken = null;
  await chrome.storage.local.remove(['clary:token', 'clary:userProfile', 'clary:encryptedGroqKey']);
}

// =================================================================================
// SECTION: FETCH WRAPPER
// =================================================================================

/**
 * A wrapper around the fetch API that automatically adds the Authorization header.
 * It handles token presence and provides a consistent way to make authenticated API calls.
 * @param {string} url The URL to fetch.
 * @param {object} options The fetch options (e.g., method, body, headers).
 * @returns {Promise<Response>} The fetch Response object.
 */
async function fetchWithAuth(url, options = {}) {
  // Ensure the access token is available before making the call.
  if (!accessToken) {
    // If there's no token, try to load it from storage. This covers cases where
    // the service worker might have been asleep.
    const storedToken = await getStoredToken();
    if (storedToken) {
      accessToken = storedToken;
    } else {
      // If no token can be found, the user is not authenticated.
      return Promise.reject({ status: 401, message: 'Not authenticated.' });
    }
  }

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  const response = await fetch(url, { ...options, headers });

  // The backend uses a 7-day JWT. There is no refresh token flow in the MVP.
  // If a 401 is received, it means the token has expired or is invalid.
  // The user must log in again.
  if (response.status === 401) {
    console.log('Access token is invalid or expired (401). Forcing logout.');
    await handleLogout();
    // Reject the promise to signal to the caller that the request failed due to auth error.
    return Promise.reject({ status: 401, message: 'Session expired. Please log in again.' });
  }

  return response;
}

// =================================================================================
// SECTION: AUTH FLOW HANDLERS
// =================================================================================

/**
 * Handles user login.
 * @param {object} credentials The user's email and password.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleLogin({ email, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.message || 'Login failed.' };
    }

    // On successful login, store the token securely and set the in-memory access token.
    accessToken = data.token;
    await storeToken(data.token);

    // Also fetch and store the user profile.
    await handleGetProfile();

    return { status: 'ok', message: 'Login successful.' };
  } catch (error) {
    console.error('Login error:', error);
    return { status: 'error', message: 'An unexpected error occurred during login.' };
  }
}

/**
 * Handles user signup.
 * @param {object} details The user's email, password, and optional API key.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleSignup({ email, password, apiKey }) {
    try {
        // Step 1: Register the user
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
            return { status: 'error', message: registerData.message || 'Signup failed.' };
        }

        // Step 2: Log the user in to get a token
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            return { status: 'error', message: 'Signup succeeded, but login failed.' };
        }

        // Store the token from login
        accessToken = loginData.token;
        await storeToken(loginData.token);

        // Step 3: If an API key was provided during signup, save it.
        if (apiKey) {
            const apiKeyResponse = await handleSaveApiKey(apiKey);
            if (apiKeyResponse.status === 'error') {
                // Signup and login were successful, but API key saving failed.
                // Inform the user but treat the overall process as a partial success.
                return { status: 'ok', message: 'Account created, but failed to save API key.' };
            }
        }
        
        // Fetch and store user profile
        await handleGetProfile();

        return { status: 'ok', message: 'Signup successful!' };
    } catch (error) {
        console.error('Signup error:', error);
        return { status: 'error', message: 'An unexpected error occurred during signup.' };
    }
}


/**
 * Handles user logout.
 * - Calls the backend's logout endpoint.
 * - Clears all local authentication data.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleLogout() {
  try {
    // Call the backend logout endpoint, but don't block failure.
    // The local state must be cleared regardless.
    if (accessToken) {
      await fetchWithAuth(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    }
  } catch (error) {
    // Log the error, but proceed with clearing local data.
    console.error('Error calling backend logout (clearing local data anyway):', error);
  } finally {
    // Always clear local and in-memory auth data.
    await clearAuthData();
  }
  return { status: 'ok', message: 'Logged out successfully.' };
}

// =================================================================================
// SECTION: USER PROFILE & API KEY HANDLERS
// =================================================================================

/**
 * Fetches the user's profile from the backend and stores it.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleGetProfile() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/user/profile`);
    if (!response.ok) {
      const errorData = await response.json();
      return { status: 'error', message: errorData.message || 'Failed to fetch profile.' };
    }
    const userProfile = await response.json();
    // Store non-sensitive user profile data for the UI to access.
    await chrome.storage.local.set({ 'clary:userProfile': userProfile });
    return { status: 'ok', user: userProfile };
  } catch (error) {
    console.error('Get profile error:', error);
    // If the error is a 401, the fetchWithAuth wrapper will have already handled logout.
    if (error.status === 401) {
        return { status: 'unauthenticated' };
    }
    return { status: 'error', message: 'Could not fetch user profile.' };
  }
}

/**
 * Saves the user's Groq API key.
 * - Encrypts the key for local storage.
 * - Sends the plaintext key to the backend for server-side encryption.
 * @param {string} apiKey The plaintext Groq API key.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleSaveApiKey(apiKey) {
  try {
    // Encrypt the key for secure local storage.
    const encryptedKey = await encryptString(apiKey, installSecret);
    await chrome.storage.local.set({ 'clary:encryptedGroqKey': encryptedKey });

    // Send the plaintext key to the backend. The backend will encrypt it separately.
    const response = await fetchWithAuth(`${API_BASE_URL}/user/apikey`, {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.message || 'Failed to save API key.' };
    }

    return { status: 'ok', message: 'API key saved successfully.' };
  } catch (error) {
    console.error('Save API key error:', error);
    return { status: 'error', message: 'An unexpected error occurred while saving the API key.' };
  }
}

/**
 * Deletes the user's Groq API key from local storage and the backend.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handleDeleteApiKey() {
  try {
    // Remove the key from local storage first.
    await chrome.storage.local.remove('clary:encryptedGroqKey');

    // Call the backend to delete the key from the database.
    const response = await fetchWithAuth(`${API_BASE_URL}/user/apikey`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.message || 'Failed to delete API key.' };
    }

    return { status: 'ok', message: 'API key deleted successfully.' };
  } catch (error) {
    console.error('Delete API key error:', error);
    return { status: 'error', message: 'An unexpected error occurred while deleting the API key.' };
  }
}

// =================================================================================
// SECTION: PROMPT HANDLERS
// =================================================================================

/**
 * Handles a prompt request (clarify or concise) by forwarding it to the backend.
 * @param {string} type The type of prompt ('clarify' or 'concise').
 * @param {string} input The user's input text.
 * @returns {Promise<object>} A response object for the content script.
 */
async function handlePrompt(type, input) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/prompt/${type}`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.message || `Prompt ${type} failed.` };
    }

    return { status: 'ok', output: data.output };
  } catch (error) {
    console.error(`Prompt ${type} error:`, error);
    if (error.status === 401) {
        return { status: 'error', message: 'Your session has expired. Please log in again.' };
    }
    return { status: 'error', message: `An unexpected error occurred during the ${type} request.` };
  }
}

// =================================================================================
// SECTION: MESSAGE ROUTER
// =================================================================================

// The central listener for all messages from content scripts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);

  // Use a switch to delegate actions to the appropriate handler.
  // Return true to indicate that sendResponse will be called asynchronously.
  switch (message.action) {
    // --- Auth ---
    case MSG.LOGIN:
      handleLogin(message.body).then(sendResponse);
      return true;
    case MSG.SIGNUP:
      handleSignup(message.body).then(sendResponse);
      return true;
    case MSG.LOGOUT:
      handleLogout().then(sendResponse);
      return true;
    case MSG.CHECK_AUTH:
        // Immediately respond with the current auth state.
        (async () => {
            const token = await getStoredToken();
            if (token) {
                accessToken = token; // Ensure in-memory token is set
                sendResponse({ status: 'authenticated' });
            } else {
                sendResponse({ status: 'unauthenticated' });
            }
        })();
        return true;


    // --- User & API Key ---
    case MSG.GET_PROFILE:
      handleGetProfile().then(sendResponse);
      return true;
    case MSG.SAVE_API_KEY:
      handleSaveApiKey(message.body.apiKey).then(sendResponse);
      return true;
    case MSG.DELETE_API_KEY:
      handleDeleteApiKey().then(sendResponse);
      return true;

    // --- Prompts ---
    case MSG.PROMPT_CLARIFY:
      handlePrompt('clarify', message.body.input).then(sendResponse);
      return true;
    case MSG.PROMPT_CONCISE:
      handlePrompt('concise', message.body.input).then(sendResponse);
      return true;

    // --- UI State ---
    case MSG.GET_UI_STATE:
        (async () => {
            const result = await chrome.storage.local.get('clary:uiState');
            sendResponse(result['clary:uiState'] || {});
        })();
        return true;
    case MSG.SET_UI_STATE:
        chrome.storage.local.set({ 'clary:uiState': message.body });
        // No response needed for set.
        break;
    
    // --- Misc ---
    case MSG.OPEN_EXTERNAL_URL:
        chrome.tabs.create({ url: message.body.url });
        break;

    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ status: 'error', message: 'Unknown action.' });
      break;
  }
  
  return true; // Keep the message channel open for async responses
});
