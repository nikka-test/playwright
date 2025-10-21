import { createTest, expect } from "../../shared/BaseTest"; // Import test utilities and assertion library
import { config } from "../../shared/config"; // Import centralized configuration

createTest("can access dashboard after login", async (baseTest) => {
  // Test case: Verify authenticated user can access dashboard
  // Ensure we're logged in
  await baseTest.ensureAuthenticated(); // Use smart authentication (session or fresh login)

  // Navigate to dashboard
  await baseTest.navigateTo(config.urls.dashboardUrl); // Go to dashboard URL from config

  // Verify we're not on the login page
  await expect(
    // Assert that we successfully accessed dashboard
    baseTest.page.locator(config.selectors.login.heading) // Find login heading element
  ).not.toBeVisible(); // Check we're NOT redirected to login (authentication worked)

  // Add dashboard-specific assertions here
  // await expect(baseTest.page.locator('[data-testid="dashboard-header"]')).toBeVisible(); // Verify dashboard elements load
});

createTest("dashboard shows user information", async (baseTest) => {
  // Test case: Verify user data displays correctly on dashboard
  await baseTest.ensureAuthenticated(); // Ensure user is logged in
  await baseTest.navigateTo(config.urls.dashboardUrl); // Navigate to dashboard page

  // Add tests for user info display
  // await expect(baseTest.page.locator('[data-testid="user-name"]')).toBeVisible(); // Check user name is displayed
  // await expect(baseTest.page.locator('[data-testid="user-email"]')).toContainText(config.testUsers.default.email); // Verify correct user email
});

createTest("dashboard navigation works", async (baseTest) => {
  // Test case: Verify dashboard navigation menu functions
  await baseTest.ensureAuthenticated(); // Ensure user is logged in
  await baseTest.navigateTo(config.urls.dashboardUrl); // Navigate to dashboard page

  // Add tests for dashboard navigation
  // await baseTest.page.click('[data-testid="menu-settings"]'); // Click settings menu item
  // await expect(baseTest.page).toHaveURL(/.*settings.*/); // Verify URL changed to settings page
});
