'''# ClaryVyb Extension-Backend Connection Specification

This document outlines the technical specifications for the connection between the ClaryVyb Chrome Extension frontend and the Node.js backend.

---

## 1. Architecture Overview

The connection architecture is designed for security and separation of concerns, primarily revolving around a background service worker that acts as the single point of contact with the backend API.

-   **`content.js` (UI Thread):** Responsible for all UI rendering and user interaction. It **never** makes direct network requests or handles sensitive data like authentication tokens. All actions are sent as messages to the background script.

-   **`background.js` (Service Worker):** The central hub for all business logic and external communication. Its responsibilities include:
    -   Handling all `fetch` calls to the backend.
    -   Managing the authentication lifecycle (login, logout, token storage).
    -   Securely storing and retrieving sensitive data (tokens, API keys) using encryption.
    -   Routing messages from the content script to the appropriate handlers.

-   **Backend API:** A Node.js (Express) server that provides endpoints for authentication, user management, and processing prompts.

## 2. Communication Protocol

Communication between `content.js` and `background.js` is handled exclusively through the `chrome.runtime.sendMessage` API. This ensures a clean and secure data flow.

### Message Actions

The `action` property of a message determines the requested operation. The following actions are defined (see `utils/messages.js`):

| Action             | Payload (`body`)                               | Description                                             |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| `login`            | `{ email, password }`                          | Authenticates the user.                                 |
| `signup`           | `{ email, password, apiKey? }`                 | Creates a new user account.                             |
| `logout`           | _None_                                         | Logs the user out and clears all session data.          |
| `checkAuth`        | _None_                                         | Checks if a valid token exists in storage.              |
| `getProfile`       | _None_                                         | Fetches the current user's profile data.                |
| `saveApiKey`       | `{ apiKey }`                                   | Saves or updates the user's Groq API key.               |
| `deleteApiKey`     | _None_                                         | Deletes the user's Groq API key.                        |
| `promptClarify`    | `{ input }`                                    | Sends a prompt to the `/api/prompt/clarify` endpoint.   |
| `promptConcise`    | `{ input }`                                    | Sends a prompt to the `/api/prompt/concise` endpoint.   |
| `getUiState`       | _None_                                         | Retrieves the last saved UI state from storage.         |
| `setUiState`       | `{ ...uiState }`                               | Saves the current UI state to storage.                  |
| `openExternalUrl`  | `{ url }`                                      | Opens a new browser tab with the specified URL.         |

### Response Format

The background script typically responds with a JSON object containing a `status` field (`'ok'` or `'error'`) and an optional `message` or data payload.

```json
// Success Response
{ "status": "ok", "message": "Login successful." }

// Error Response
{ "status": "error", "message": "Invalid credentials." }
```

## 3. Authentication Flow

The backend uses a single, long-lived JSON Web Token (JWT) for authentication. The MVP does **not** implement a refresh token strategy.

1.  **Login/Signup:** The user submits credentials via the UI. `content.js` sends a `login` or `signup` message to `background.js`.
2.  **Token Reception:** `background.js` calls the backend's `/api/auth/login` or `/api/auth/register` endpoint. On success, the backend returns a JWT.
3.  **Secure Storage:** The `background.js` script encrypts the received JWT using the `clary:installSecret` key and stores it in `chrome.storage.local` under the key `clary:token`.
4.  **In-Memory Token:** The plaintext JWT is stored in a local variable (`accessToken`) within the `background.js` service worker for immediate use. This token is lost if the service worker is terminated.
5.  **Authenticated Requests:** For all subsequent API calls, the `fetchWithAuth` wrapper function automatically attaches the in-memory `accessToken` to the `Authorization: Bearer <token>` header.
6.  **Session Restoration:** On browser startup or extension initialization, `background.js` attempts to load and decrypt the `clary:token` from storage to restore the session.
7.  **Token Expiry (401 Handling):** If any API request returns a `401 Unauthorized` status, the `fetchWithAuth` function assumes the token has expired. It automatically triggers the `handleLogout` process, which clears all authentication data and forces the user to log in again.

## 4. Secure Storage (`chrome.storage.local`)

All sensitive data persisted by the extension is encrypted at rest using the **Web Crypto API (AES-GCM)**.

-   **Master Key (`clary:installSecret`):** On first installation, a unique, non-extractable `CryptoKey` is generated and stored. This key is used to encrypt all other sensitive data. If this key is lost, all encrypted data becomes inaccessible.

-   **Stored Data Keys:**

| Storage Key              | Encrypted | Description                                                                 |
| ------------------------ | :-------: | --------------------------------------------------------------------------- |
| `clary:token`            |    Yes    | The user's JWT for backend authentication.                                  |
| `clary:encryptedGroqKey` |    Yes    | The user's Groq API key.                                                    |
| `clary:userProfile`      |    No     | Non-sensitive user data like email and creation date for UI display.        |
| `clary:uiState`          |    No     | Non-sensitive state of the UI (e.g., widget position, size).                |

## 5. API Endpoints Called by `background.js`

The base URL is configured as `http://localhost:5000/api`.

| Method | Endpoint                 | Authentication | Description                                      |
| :----- | :----------------------- | :------------: | ------------------------------------------------ |
| `POST` | `/auth/login`            |       No       | Authenticates a user and returns a JWT.          |
| `POST` | `/auth/register`         |       No       | Registers a new user.                            |
| `POST` | `/auth/logout`           |      Yes       | Invalidates the current JWT on the backend.      |
| `GET`  | `/user/profile`          |      Yes       | Retrieves the authenticated user's profile.      |
| `PUT`  | `/user/apikey`           |      Yes       | Saves or updates the user's Groq API key.        |
| `DELETE`| `/user/apikey`           |      Yes       | Deletes the user's Groq API key.                 |
| `POST` | `/prompt/clarify`        |      Yes       | Submits a prompt for clarification.              |
| `POST` | `/prompt/concise`        |      Yes       | Submits a prompt for conciseness.                |

## 6. Error Handling

-   **Network/Server Errors:** Any failed `fetch` call or non-2xx response from the backend is caught in `background.js`. A response message with `{ status: 'error', message: '...' }` is sent to `content.js`.
-   **UI Feedback:** The `content.js` script displays error messages in the widget's footer area for a brief period.
-   **Authentication Errors (401):** As detailed above, a `401` status code is treated as a session expiry. It triggers a forced logout, clears all sensitive stored data, and presents the login screen to the user with an explanatory message.
'''