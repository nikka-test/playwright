/**
 * Shared configuration for Playwright tests - Central place for all test settings
 */
export const config = {
  // Export configuration object for use across all test files
  // Application URLs - Define all website URLs used in tests
  urls: {
    baseUrl: "https://app.shiftcare.com/", // Main application URL
    loginUrl: "https://app.shiftcare.com/", // Login page URL
    dashboardUrl: "https://app.shiftcare.com/users/dashboard", // Dashboard page URL after login
  },

  // Test timeouts (in milliseconds) - Define how long to wait for various operations
  timeouts: {
    default: 30000, // 30 seconds - Standard timeout for most operations
    login: 120000, // 2 minutes - Extended timeout for manual reCAPTCHA solving
    recaptcha: 60000, // 1 minute - Time allowed to solve reCAPTCHA manually
    navigation: 15000, // 15 seconds - Time to wait for page navigation/loading
  },

  // Test credentials - Login information for test accounts
  testUsers: {
    default: {
      // Default test user account
      email: "nikkageneta1@gmail.com", // Email address for login
      password: "P@55wor0", // Password for login
    },
  },

  // Session storage settings - Controls how login sessions are saved/managed
  auth: {
    storageFile: "playwright/.auth/user.json", // File path to save session data
    sessionValidHours: 24, // How long saved session remains valid (hours)
  },

  // Selectors - CSS selectors to find elements on web pages
  selectors: {
    login: {
      // Selectors for login page elements
      heading: 'h1:has-text("Sign in to your account")', // Login page title element
      emailInput: "#user_email", // Email input field selector
      passwordInput: "#user_password", // Password input field selector
      submitButton: 'button[name="Sign In"], input[type="submit"]', // Login submit button
      recaptchaResponse: '[name="g-recaptcha-response"]', // Hidden reCAPTCHA response field
    },
    dashboard: {
      // Selectors for dashboard page elements
      userMenu: '[data-testid="user-menu"]', // User menu dropdown selector
      welcome: "text=Welcome", // Welcome message text selector
    },
  },

  // Logging configuration - Controls test logging behavior
  logging: {
    enabled: true, // Turn logging on/off globally
    logLevel: "info" as "debug" | "info" | "warn" | "error", // Set minimum log level to display
  },
};

// Utility functions - Helper functions used across tests
export const utils = {
  // Generate random test data - Creates unique email addresses for testing
  generateRandomEmail: () => `test.${Date.now()}@example.com`, // Uses timestamp for uniqueness

  // Wait helper - Pauses execution for specified milliseconds
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), // Returns promise that resolves after delay

  // Format duration for logs - Converts milliseconds to readable format
  formatDuration: (ms: number) => {
    // Takes milliseconds as input
    if (ms < 1000) return `${ms}ms`; // Show as milliseconds if less than 1 second
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; // Show as seconds if less than 1 minute
    return `${(ms / 60000).toFixed(1)}m`; // Show as minutes if 1 minute or more
  },
};

export default config; // Make config available as default export
