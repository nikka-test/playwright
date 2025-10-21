# Playwright Test Suite - Refactored

This is a refactored Playwright test suite with improved organization, error handling, and session management.

## 📁 Project Structure

```
tests/
├── shared/                     # Shared utilities and configuration
│   ├── config.ts              # Centralized configuration
│   ├── logger.ts              # Centralized logging utility
│   └── BaseTest.ts            # Base test class with common functionality
├── shiftcare/                 # Shiftcare application tests
│   ├── auth/                  # Authentication-related tests
│   │   └── authentication.spec.ts
│   ├── dashboard/             # Dashboard-related tests
│   │   └── dashboard.spec.ts
│   └── pages/                 # Page Object Models
│       └── LoginPage.ts       # Login page functionality
└── playwright/.auth/          # Saved authentication sessions
    └── user.json             # Saved session data (auto-generated)
```

## 🚀 Features

### ✨ Session Management

- **Automatic session saving** after successful login
- **Session reuse** across test runs (expires after 24 hours)
- **Smart fallback** to fresh login when session expires

### 🏗️ Page Object Model

- **LoginPage class** with comprehensive login functionality
- **Error handling** with detailed logging
- **reCAPTCHA handling** for manual solving

### 🛠️ Base Test Class

- **Common functionality** shared across all tests
- **Automatic setup/cleanup** for each test
- **Enhanced error handling** with screenshots on failure
- **Centralized logging** for better debugging

### ⚙️ Configuration Management

- **Centralized config** for URLs, timeouts, selectors
- **Environment-specific** settings support
- **Test data management** with default credentials

## 📋 Usage

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test suite
npx playwright test tests/shiftcare/auth/
npx playwright test tests/shiftcare/dashboard/

# Run with headed mode (for manual reCAPTCHA)
npx playwright test --headed

# Run specific test file
npx playwright test tests/shiftcare/auth/authentication.spec.ts
```

### Writing New Tests

Use the `createTest` helper for consistent test structure:

```typescript
import { createTest, expect } from "../../shared/BaseTest";
import { config } from "../../shared/config";

createTest("my new test", async (baseTest) => {
  // Ensure authentication if needed
  await baseTest.ensureAuthenticated();

  // Navigate to page
  await baseTest.navigateTo(config.urls.someUrl);

  // Test functionality
  await expect(baseTest.page.locator("#element")).toBeVisible();
});
```

### Using the LoginPage

```typescript
// In a test
const loginPage = new LoginPage(page);

// Simple login
await loginPage.login();

// Login with custom credentials
await loginPage.login({
  email: "custom@email.com",
  password: "custompass",
});

// Smart login (uses session if available)
await loginPage.ensureLoggedIn();

// Clear saved session
loginPage.clearSavedSession();
```

## 🔧 Configuration

### URLs and Endpoints

Configure in `tests/shared/config.ts`:

```typescript
urls: {
  baseUrl: 'https://app.shiftcare.com/',
  loginUrl: 'https://app.shiftcare.com/',
  dashboardUrl: 'https://app.shiftcare.com/dashboard',
}
```

### Timeouts

```typescript
timeouts: {
  default: 30000,     // 30 seconds
  login: 120000,      // 2 minutes for manual reCAPTCHA
  recaptcha: 60000,   // 1 minute for reCAPTCHA solving
}
```

### Test Credentials

```typescript
testUsers: {
  default: {
    email: 'your-email@example.com',
    password: 'your-password'
  }
}
```

## 📊 Logging

The suite includes comprehensive logging:

- **Debug logs** for detailed troubleshooting
- **Info logs** for test progress
- **Warn logs** for non-critical issues
- **Error logs** with stack traces

Logs are contextual and include timestamps and categories.

## 🎯 Session Management

### How it works:

1. **First test run**: Manual reCAPTCHA → Session saved to `playwright/.auth/user.json`
2. **Subsequent runs**: Session loaded → Skip login entirely
3. **Session expires**: Automatic detection → Fresh login

### Benefits:

- ✅ **Faster test execution** (skip login after first run)
- ✅ **Less manual intervention** (solve reCAPTCHA once)
- ✅ **Reliable session handling** (automatic expiry detection)

## 🔄 Migration from Old Structure

The old test files have been refactored:

- `login.spec.ts` → `auth/authentication.spec.ts` (enhanced)
- `dashboard.spec.ts` → `dashboard/dashboard.spec.ts` (improved)
- `auth.setup.ts` → Removed (replaced by LoginPage session management)

## 🏃‍♂️ Quick Start

1. **First run** (will require manual reCAPTCHA):

```bash
npx playwright test tests/shiftcare/auth/authentication.spec.ts --headed
```

2. **Subsequent runs** (will use saved session):

```bash
npx playwright test tests/shiftcare/dashboard/dashboard.spec.ts
```

3. **Clear session** (force fresh login):

```bash
# Delete the session file
rm playwright/.auth/user.json
```

## 🐛 Troubleshooting

### Session Issues

- Check if `playwright/.auth/user.json` exists
- Verify session age (expires after 24 hours)
- Clear session and re-authenticate

### reCAPTCHA Issues

- Ensure tests run in headed mode: `--headed`
- Increase timeout in config if needed
- Check network connectivity

### Test Failures

- Screenshots automatically saved to `test-results/screenshots/`
- Check logs for detailed error information
- Verify selectors in `config.ts` are up to date
