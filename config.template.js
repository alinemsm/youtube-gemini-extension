// Template configuration file for API keys
// Copy this file to config.js and add your actual API key
const config = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  // For browser environment
  window.config = config;
} 