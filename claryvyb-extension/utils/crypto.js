// claryvyb-extension/utils/crypto.js

// ===============================
// SECTION: Crypto Helper Functions
// ===============================

// NOTE: These functions use the Web Crypto API (SubtleCrypto) for AES-GCM encryption.
// This is used to securely store sensitive data like tokens and API keys in chrome.storage.local.

// --- CONFIGURATION ---
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // AES-GCM standard IV length is 12 bytes (96 bits)

// === KEY MANAGEMENT ===

/**
 * Generates a new cryptographic key for AES-GCM encryption.
 * @returns {Promise<CryptoKey>} The generated key.
 */
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // Key is extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey into a raw, storable format (ArrayBuffer).
 * @param {CryptoKey} key The key to export.
 * @returns {Promise<ArrayBuffer>} The raw key data.
 */
async function exportKey(key) {
  return await crypto.subtle.exportKey('raw', key);
}

/**
 * Imports a raw key (ArrayBuffer) back into a CryptoKey object.
 * @param {ArrayBuffer} rawKey The raw key data to import.
 * @returns {Promise<CryptoKey>} The imported CryptoKey.
 */
async function importKey(rawKey) {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: ALGORITHM },
    true, // Key is extractable
    ['encrypt', 'decrypt']
  );
}

// === ENCRYPTION & DECRYPTION ===

/**
 * Encrypts a plaintext string using AES-GCM.
 * @param {string} plaintext The string to encrypt.
 * @param {CryptoKey} key The encryption key.
 * @returns {Promise<string>} A base64-encoded string containing the IV and ciphertext.
 */
export async function encryptString(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedPlaintext
  );

  // Combine IV and ciphertext into a single buffer for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as a base64 string for easy storage in JSON
  return btoa(String.fromCharCode.apply(null, combined));
}

/**
 * Decrypts a base64-encoded AES-GCM string.
 * @param {string} base64Ciphertext The base64-encoded string (IV + ciphertext).
 * @param {CryptoKey} key The decryption key.
 * @returns {Promise<string>} The decrypted plaintext string.
 */
export async function decryptString(base64Ciphertext, key) {
  try {
    const combined = new Uint8Array(atob(base64Ciphertext).split('').map(c => c.charCodeAt(0)));

    // Extract the IV and ciphertext from the combined buffer
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // It's crucial to handle decryption errors, as they can indicate tampered data or a wrong key.
    throw new Error('Failed to decrypt data.');
  }
}

// === HIGH-LEVEL STORAGE KEY MANAGEMENT ===

/**
 * Retrieves the installation-specific secret key from storage, or creates one if it doesn't exist.
 * This key is used to encrypt all other sensitive data.
 * @returns {Promise<CryptoKey>} The master encryption key.
 */
export async function getOrCreateInstallSecret() {
  const storageKey = 'clary:installSecret';
  let result = await chrome.storage.local.get(storageKey);

  if (result[storageKey]) {
    // Key exists, import it
    const rawKey = new Uint8Array(atob(result[storageKey]).split('').map(c => c.charCodeAt(0)));
    return await importKey(rawKey.buffer);
  } else {
    // Key doesn't exist, create and store it
    const newKey = await generateKey();
    const rawKey = await exportKey(newKey);
    const storableKey = btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)));
    
    await chrome.storage.local.set({ [storageKey]: storableKey });
    console.log('New installation secret generated and stored.');
    return newKey;
  }
}
