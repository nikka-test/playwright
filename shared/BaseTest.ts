import { test as base, expect, Page } from "@playwright/test"; // Import Playwright testing utilities
import { LoginPage } from "../shiftcare/pages/LoginPage"; // Import LoginPage class for authentication
import { config } from "./config"; // Import centralized configuration
import { logger } from "./logger"; // Import logging utility

// Extend the base test with custom fixtures and common functionality
export const test = base.extend<{
  // Extend Playwright's base test with custom fixtures
  loginPage: LoginPage; // Add LoginPage as a custom fixture type
}>({
  // Custom fixture for LoginPage - Automatically creates LoginPage instance for each test
  loginPage: async ({ page }, use) => {
    // Fixture function receives page and use function
    const loginPage = new LoginPage(page); // Create LoginPage instance with the test page
    await use(loginPage); // Make loginPage available to test and handle cleanup automatically
  },
});

// Base test class with common functionality - Provides reusable methods for all tests
export class BaseTest {
  public page: Page; // Playwright Page instance for browser interactions
  public loginPage: LoginPage; // LoginPage instance for authentication operations

  constructor(page: Page) {
    // Initialize BaseTest with a Playwright page
    this.page = page; // Store the page instance
    this.loginPage = new LoginPage(page); // Create LoginPage instance for this test
  }

  // Setup method to be called at the beginning of each test
  async setup(): Promise<void> {
    // Initialize common test settings
    // Set default timeout for all page operations
    this.page.setDefaultTimeout(config.timeouts.default); // Apply default timeout from config

    // Add any global setup here (browser settings, cookies, etc.)
    logger.debug("Base test setup completed"); // Log setup completion
  }

  // Cleanup method to be called at the end of each test
  async cleanup(): Promise<void> {
    // Clean up after test completion
    // Add any global cleanup here (clear storage, close connections, etc.)
    logger.debug("Base test cleanup completed"); // Log cleanup completion
  }

  // Ensure user is logged in before running test
  async ensureAuthenticated(): Promise<void> {
    // Guarantee user authentication
    await this.loginPage.ensureLoggedIn(); // Use LoginPage to handle authentication (with session management)
  }

  // Navigate to a specific URL with error handling
  async navigateTo(url: string, waitForLoad: boolean = true): Promise<void> {
    // Navigate to URL with optional loading wait
    try {
      await this.page.goto(url); // Navigate to the specified URL
      if (waitForLoad) {
        // If waitForLoad is true (default)
        await this.page.waitForLoadState("networkidle"); // Wait until network activity stops (page fully loaded)
      }
      logger.debug(`Navigated to: ${url}`); // Log successful navigation
    } catch (error) {
      logger.error(`Failed to navigate to: ${url}`, error as Error); // Log navigation failure
      throw error; // Re-throw error to fail the test
    }
  }

  // Wait for element with better error handling
  async waitForElement(selector: string, timeout?: number): Promise<void> {
    // Wait for element to appear with custom timeout
    try {
      await this.page.waitForSelector(selector, {
        // Wait for element matching the CSS selector
        timeout: timeout || config.timeouts.default, // Use custom timeout or default from config
      });
      logger.debug(`Element found: ${selector}`); // Log successful element location
    } catch (error) {
      logger.error(`Element not found: ${selector}`, error as Error); // Log element not found error
      throw error; // Re-throw error to fail the test
    }
  }

  // Take screenshot with automatic naming
  async takeScreenshot(name?: string): Promise<void> {
    // Capture screenshot for debugging or documentation
    try {
      const screenshotName = name || `screenshot-${Date.now()}`; // Use provided name or generate timestamp-based name
      await this.page.screenshot({
        // Capture screenshot of current page
        path: `test-results/screenshots/${screenshotName}.png`, // Save to screenshots folder
        fullPage: true, // Capture entire page, not just viewport
      });
      logger.debug(`Screenshot saved: ${screenshotName}.png`); // Log screenshot success
    } catch (error) {
      logger.error("Failed to take screenshot", error as Error); // Log screenshot failure (don't throw - screenshots are optional)
    }
  }

  // Verify page title
  async verifyPageTitle(expectedTitle: string | RegExp): Promise<void> {
    // Assert page title matches expected value
    try {
      await expect(this.page).toHaveTitle(expectedTitle); // Use Playwright assertion to verify title
      logger.debug(`Page title verified: ${expectedTitle}`); // Log successful title verification
    } catch (error) {
      logger.error(`Page title verification failed`, error as Error); // Log title verification failure
      throw error; // Re-throw error to fail the test
    }
  }

  // Wait for URL change
  async waitForUrl(url: string | RegExp, timeout?: number): Promise<void> {
    // Wait for page URL to change to expected value
    try {
      await this.page.waitForURL(url, {
        // Wait for URL to match expected pattern
        timeout: timeout || config.timeouts.navigation, // Use custom timeout or navigation timeout from config
      });
      logger.debug(`URL change detected: ${url}`); // Log successful URL change
    } catch (error) {
      logger.error(`URL change timeout: ${url}`, error as Error); // Log URL change timeout
      throw error; // Re-throw error to fail the test
    }
  }
}

// Export the extended test and expect - Make extended test and expect available to test files
export { expect }; // Re-export Playwright's expect for assertions

// Helper function to create a test with common setup - Wrapper function that adds automatic setup/cleanup
export function createTest(
  testName: string, // Name of the test case
  testFn: (baseTest: BaseTest) => Promise<void> // Test function that receives BaseTest instance
) {
  return test(testName, async ({ page }) => {
    // Return Playwright test with automatic setup
    const startTime = Date.now(); // Record test start time for duration calculation
    const baseTest = new BaseTest(page); // Create BaseTest instance for this test

    try {
      logger.testStart(testName); // Log test start

      // Set timeout for manual reCAPTCHA tests
      test.setTimeout(config.timeouts.login); // Set long timeout to allow manual reCAPTCHA solving

      await baseTest.setup(); // Run common setup (timeouts, etc.)
      await testFn(baseTest); // Execute the actual test logic
    } catch (error) {
      logger.error(`Test failed: ${testName}`, error as Error); // Log test failure
      await baseTest.takeScreenshot(`failed-${testName.replace(/\s+/g, "-")}`); // Take screenshot on failure for debugging
      throw error; // Re-throw error to mark test as failed
    } finally {
      await baseTest.cleanup(); // Always run cleanup, even if test fails
      const duration = Date.now() - startTime; // Calculate test execution time
      logger.testEnd(testName, duration); // Log test completion with duration
    }
  });
}
