import { Page, expect } from "@playwright/test"; // Import Playwright testing utilities
import * as fs from "fs"; // File system operations for session storage
import * as path from "path"; // Path utilities for file operations
import { config } from "../../shared/config"; // Import centralized configuration
import { logger } from "../../shared/logger"; // Import logging utility

interface LoginCredentials {
  // Type definition for login credentials
  email: string; // User email address
  password: string; // User password
}

export class LoginPage {
  // Page Object Model class for login functionality
  private authFile = config.auth.storageFile; // Path to session storage file

  constructor(private page: Page) {} // Initialize LoginPage with Playwright page instance

  // Load saved session if available
  async loadSavedSession(): Promise<boolean> {
    // Restore authentication from saved session file
    if (!fs.existsSync(this.authFile)) {
      // Check if session file exists
      logger.debug("No saved session file found"); // Log when no session file exists
      return false; // Return false when no session to load
    }

    try {
      logger.info("Loading saved session...", "SESSION"); // Log session loading attempt
      const authData = JSON.parse(fs.readFileSync(this.authFile, "utf-8")); // Read and parse session data from file

      if (authData.cookies && Array.isArray(authData.cookies)) {
        // Validate session data structure
        await this.page.context().addCookies(authData.cookies); // Restore cookies to browser context
        logger.sessionLoaded(); // Log successful session loading
        return true; // Return success
      } else {
        logger.warn("Invalid session data structure"); // Log invalid session format
        return false; // Return failure for invalid data
      }
    } catch (error) {
      logger.error("Failed to load session", error as Error); // Log session loading errors
      return false; // Return failure on any error
    }
  }

  // Save current session
  async saveSession(): Promise<boolean> {
    // Store authentication state to file for reuse
    try {
      logger.info("Saving session...", "SESSION"); // Log session saving attempt

      // Create directory if it doesn't exist
      const authDir = path.dirname(this.authFile); // Get directory path for auth file
      if (!fs.existsSync(authDir)) {
        // Check if directory exists
        fs.mkdirSync(authDir, { recursive: true }); // Create directory and parent directories if needed
      }

      const authData = await this.page.context().storageState(); // Get current browser state (cookies, localStorage, etc.)
      fs.writeFileSync(this.authFile, JSON.stringify(authData, null, 2)); // Save auth data as formatted JSON
      logger.sessionSaved(); // Log successful session saving
      return true; // Return success
    } catch (error) {
      logger.error("Failed to save session", error as Error); // Log session saving errors
      return false; // Return failure on any error
    }
  }

  // Check if saved session is still valid
  isSessionValid(): boolean {
    // Validate if saved session is within expiry time
    if (!fs.existsSync(this.authFile)) {
      // Check if session file exists
      logger.debug("No session file exists"); // Log when no session file found
      return false; // Return false when no session exists
    }

    try {
      const stats = fs.statSync(this.authFile); // Get file statistics (creation time, etc.)
      const ageInHours = // Calculate session age in hours
        (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
      const validHours = config.auth.sessionValidHours; // Get valid hours from config

      if (ageInHours < validHours) {
        // Check if session is within valid time
        logger.debug(
          // Log session is still valid with age info
          `Saved session is ${ageInHours.toFixed(1)} hours old (still valid)`
        );
        return true; // Return true for valid session
      } else {
        logger.sessionExpired(); // Log session expiration
        logger.debug(
          // Log detailed expiration info
          `Session is ${ageInHours.toFixed(
            1
          )} hours old (expired after ${validHours}h)`
        );
        return false; // Return false for expired session
      }
    } catch (error) {
      logger.error("Failed to check session validity", error as Error); // Log validation errors
      return false; // Return false on any error
    }
  }

  // Navigate to the login page
  async goto(): Promise<void> {
    // Navigate browser to the login URL
    try {
      await this.page.goto(config.urls.loginUrl); // Navigate to login URL from config
      logger.debug(`Navigated to ${config.urls.loginUrl}`); // Log successful navigation
    } catch (error) {
      logger.error("Failed to navigate to login page", error as Error); // Log navigation errors
      throw error; // Re-throw error to fail the test
    }
  }

  // Check if we're on the login page
  async isOnLoginPage(): Promise<boolean> {
    // Determine if currently on login page
    try {
      const loginHeading = this.page.locator(config.selectors.login.heading); // Find login page heading element
      const isVisible = await loginHeading.isVisible({ timeout: 3000 }); // Check if heading is visible (3 second timeout)
      logger.debug(
        // Log login page detection result
        `Login page check: ${isVisible ? "on login page" : "not on login page"}`
      );
      return isVisible; // Return true if on login page
    } catch (error) {
      logger.debug("Login page check failed, assuming not on login page"); // Log check failure
      return false; // Assume not on login page if check fails
    }
  }

  // Check if we're already logged in
  async isLoggedIn(): Promise<boolean> {
    // Check if user is authenticated
    return !(await this.isOnLoginPage()); // User is logged in if NOT on login page
  }

  // Perform login with manual reCAPTCHA solving
  async login(credentials?: LoginCredentials): Promise<void> {
    // Execute complete login process
    const creds = credentials || config.testUsers.default; // Use provided credentials or default from config

    try {
      logger.loginStart(); // Log login process start

      // Navigate to login page if not already there
      await this.goto(); // Ensure we're on the login page

      // Check if already logged in
      if (await this.isLoggedIn()) {
        // Skip login if already authenticated
        logger.info("Already logged in, skipping login process"); // Log skip reason
        return; // Exit early if already logged in
      }

      logger.info("Filling login form"); // Log form filling start

      // Fill login form with error handling
      try {
        await this.page // Fill email input field
          .locator(config.selectors.login.emailInput) // Find email input using CSS selector
          .fill(creds.email); // Enter email address
        await this.page // Fill password input field
          .locator(config.selectors.login.passwordInput) // Find password input using CSS selector
          .fill(creds.password); // Enter password
      } catch (error) {
        logger.error("Failed to fill login form", error as Error); // Log form filling failure
        throw new Error("Login form fields not accessible"); // Throw descriptive error
      }

      // Handle reCAPTCHA
      await this.handleRecaptcha(); // Wait for manual reCAPTCHA solving

      // Submit form
      await this.submitLogin(); // Click submit button

      // Wait for login success
      await this.waitForLoginSuccess(); // Verify login completed

      logger.loginSuccess(); // Log successful login

      // Save session after successful login
      await this.saveSession(); // Store session for future use
    } catch (error) {
      logger.loginFailed(error as Error); // Log login failure
      throw error; // Re-throw error to fail the test
    }
  }

  // Handle reCAPTCHA solving
  private async handleRecaptcha(): Promise<void> {
    // Wait for user to manually solve reCAPTCHA
    logger.info("Please solve the reCAPTCHA manually...", "RECAPTCHA"); // Instruct user to solve reCAPTCHA
    logger.info(
      // Log timeout information
      `Waiting for reCAPTCHA completion (max ${
        config.timeouts.recaptcha / 1000 // Convert milliseconds to seconds for display
      } seconds)`,
      "RECAPTCHA"
    );

    try {
      await this.page.waitForFunction(
        // Wait for reCAPTCHA response field to be populated
        () => {
          const recaptchaResponse = document.querySelector(
            // Find reCAPTCHA response hidden field
            '[name="g-recaptcha-response"]'
          ) as HTMLTextAreaElement;
          return recaptchaResponse && recaptchaResponse.value.length > 0; // Return true when reCAPTCHA is solved (field has value)
        },
        { timeout: config.timeouts.recaptcha } // Use reCAPTCHA timeout from config
      );
      logger.recaptchaSolved(); // Log successful reCAPTCHA solving
    } catch (error) {
      logger.recaptchaTimeout(); // Log timeout (continue anyway - some sites may not require it)
    }
  }

  // Submit the login form
  private async submitLogin(): Promise<void> {
    // Click the login submit button
    try {
      const submitButton = this.page.getByRole("button", { name: "Sign In" }); // Find submit button by role and text
      await submitButton.click(); // Click the submit button
      logger.debug("Login form submitted"); // Log successful form submission
    } catch (error) {
      logger.error("Failed to submit login form", error as Error); // Log submission failure
      throw new Error("Could not submit login form"); // Throw descriptive error
    }
  }

  // Wait for login to complete successfully
  private async waitForLoginSuccess(): Promise<void> {
    // Verify login completed and redirect occurred
    try {
      await this.page.waitForLoadState("networkidle", {
        // Wait for network activity to settle
        timeout: config.timeouts.navigation, // Use navigation timeout from config
      });

      // Verify we're no longer on the login page
      if (await this.isOnLoginPage()) {
        // Check if still on login page after submission
        throw new Error( // Throw error if login failed (still on login page)
          "Still on login page after submission - login may have failed"
        );
      }

      logger.debug("Login success verified"); // Log successful login verification
    } catch (error) {
      logger.error("Login verification failed", error as Error); // Log verification failure
      throw error; // Re-throw error to fail the test
    }
  }

  // Smart login with session management
  async ensureLoggedIn(credentials?: LoginCredentials): Promise<void> {
    // Intelligent authentication with session reuse
    try {
      // Try to load saved session first
      if (this.isSessionValid()) {
        // Check if we have a valid saved session
        logger.info("Attempting to use saved session...", "SESSION"); // Log session reuse attempt
        await this.loadSavedSession(); // Restore saved authentication state
        await this.goto(); // Navigate to login page to test session

        // Check if session worked
        if (await this.isLoggedIn()) {
          // Verify session successfully authenticated
          logger.info("Saved session is still valid!"); // Log successful session reuse
          return; // Exit early - authentication complete
        } else {
          logger.warn("Saved session expired, need fresh login"); // Log session failure
        }
      }

      // Perform fresh login if no valid session
      await this.goto(); // Navigate to login page
      if (await this.isOnLoginPage()) {
        // Check if login is required
        logger.info("Not logged in - performing fresh login"); // Log fresh login start
        await this.login(credentials); // Execute full login process
      } else {
        logger.info("Already logged in!"); // Log if already authenticated
      }
    } catch (error) {
      logger.error("Failed to ensure logged in", error as Error); // Log authentication failure
      throw error; // Re-throw error to fail the test
    }
  }

  // Clear saved session (useful for logout tests)
  clearSavedSession(): void {
    // Delete saved session file
    try {
      if (fs.existsSync(this.authFile)) {
        // Check if session file exists
        fs.unlinkSync(this.authFile); // Delete the session file
        logger.info("Saved session cleared"); // Log successful session clearing
      } else {
        logger.debug("No saved session to clear"); // Log when no session exists to clear
      }
    } catch (error) {
      logger.error("Failed to clear saved session", error as Error); // Log clearing failure
    }
  }
}
