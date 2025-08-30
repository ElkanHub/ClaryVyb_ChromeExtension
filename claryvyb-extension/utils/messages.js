// claryvyb-extension/utils/messages.js

// =================================
// SECTION: Message Action Constants
// =================================

// NOTE: Using constants for message actions reduces the risk of typos
// and makes it easier to track message types across the extension.

export const MSG = {
  // Auth Actions
  LOGIN: 'login',
  SIGNUP: 'signup',
  LOGOUT: 'logout',
  CHECK_AUTH: 'checkAuth', // Check if user is authenticated

  // User Profile & API Key Actions
  GET_PROFILE: 'getProfile',
  SAVE_API_KEY: 'saveApiKey',
  DELETE_API_KEY: 'deleteApiKey',

  // Prompt Actions
  PROMPT_CLARIFY: 'promptClarify',
  PROMPT_CONCISE: 'promptConcise',

  // UI State Actions
  GET_UI_STATE: 'getUiState',
  SET_UI_STATE: 'setUiState',

  // General Actions
  OPEN_OPTIONS_PAGE: 'openOptionsPage',
  OPEN_EXTERNAL_URL: 'openExternalUrl',
};
