import { createTest, expect } from "../../shared/BaseTest"; // Import test utilities and assertion library
import { config } from "../../shared/config"; // Import centralized configuration

createTest("user can login successfully", async (baseTest) => {
  // Test case: Verify successful login process
  // Navigate to login page
  await baseTest.loginPage.goto(); // Go to the login URL

  // Verify we're on the login page
  await expect(
    // Assert that login page elements are visible
    baseTest.page.locator(config.selectors.login.heading) // Find login heading element
  ).toBeVisible(); // Check element is displayed on page

  // Perform login
  await baseTest.loginPage.login(); // Execute complete login process (form filling, reCAPTCHA, submission)

  // Verify login was successful
  await expect(
    // Assert that we're no longer on login page
    baseTest.page.locator(config.selectors.login.heading) // Find login heading element
  ).not.toBeVisible(); // Check element is NOT visible (redirected away from login)
});

createTest("user stays logged in with valid session", async (baseTest) => {
  // Test case: Verify session persistence works
  // This test should use saved session from previous test
  await baseTest.ensureAuthenticated(); // Use smart authentication (should load saved session)

  // Verify we're not redirected to login page
  await expect(
    // Assert that session kept us logged in
    baseTest.page.locator(config.selectors.login.heading) // Find login heading element
  ).not.toBeVisible(); // Check we're NOT on login page (session worked)
});

createTest("user can logout", async (baseTest) => {
  // Test case: Verify logout functionality
  // Ensure logged in first
  await baseTest.ensureAuthenticated(); // Make sure user is authenticated before testing logout

  // TODO: Add logout functionality when available
  // await baseTest.page.click('[data-testid="logout-button"]'); // Click logout button when implemented

  // For now, just clear the session
  baseTest.loginPage.clearSavedSession(); // Simulate logout by clearing saved session

  // Navigate to app and verify we're redirected to login
  await baseTest.navigateTo(config.urls.baseUrl); // Go to main application URL
  await expect(
    // Assert that we're redirected to login page
    baseTest.page.locator(config.selectors.login.heading) // Find login heading element
  ).toBeVisible(); // Check we're back on login page (logout successful)
});
