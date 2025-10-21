/**
 * Centralized logging utility for tests - Provides consistent logging across all test files
 */
import { config } from "./config"; // Import configuration settings

type LogLevel = "debug" | "info" | "warn" | "error"; // Define valid log levels

class Logger {
  // Main logging class to handle all test output
  private logLevel: LogLevel = config.logging.logLevel; // Set minimum log level from config
  private enabled: boolean = config.logging.enabled; // Enable/disable logging from config

  private levels: Record<LogLevel, number> = {
    // Numeric levels for comparison (higher = more important)
    debug: 0, // Detailed troubleshooting information
    info: 1, // General informational messages
    warn: 2, // Warning messages for potential issues
    error: 3, // Error messages for failures
  };

  private shouldLog(level: LogLevel): boolean {
    // Check if message should be displayed
    return this.enabled && this.levels[level] >= this.levels[this.logLevel]; // Only log if enabled and level is high enough
  }

  private formatMessage(
    // Create standardized log message format
    level: LogLevel, // Log level (debug, info, warn, error)
    message: string, // The actual message to log
    context?: string // Optional context (like "LOGIN", "SESSION")
  ): string {
    const timestamp = new Date().toISOString(); // Create ISO timestamp
    const contextStr = context ? ` [${context}]` : ""; // Add context in brackets if provided
    return `${timestamp} ${level.toUpperCase()}${contextStr}: ${message}`; // Format: "2024-01-01T12:00:00.000Z INFO [LOGIN]: Message"
  }

  debug(message: string, context?: string): void {
    // Log debug messages (detailed troubleshooting)
    if (this.shouldLog("debug")) {
      // Only log if debug level is enabled
      console.debug(`🔍 ${this.formatMessage("debug", message, context)}`); // Use magnifying glass emoji for debug
    }
  }

  info(message: string, context?: string): void {
    // Log informational messages (general progress)
    if (this.shouldLog("info")) {
      // Only log if info level or higher is enabled
      console.log(`ℹ️ ${this.formatMessage("info", message, context)}`); // Use info emoji for informational messages
    }
  }

  warn(message: string, context?: string): void {
    // Log warning messages (potential issues)
    if (this.shouldLog("warn")) {
      // Only log if warn level or higher is enabled
      console.warn(`⚠️ ${this.formatMessage("warn", message, context)}`); // Use warning emoji for warnings
    }
  }

  error(message: string, error?: Error, context?: string): void {
    // Log error messages (failures)
    if (this.shouldLog("error")) {
      // Only log if error level is enabled (should always be true)
      console.error(`❌ ${this.formatMessage("error", message, context)}`); // Use X emoji for errors
      if (error) {
        // If an Error object is provided
        console.error(error.stack); // Also log the full stack trace for debugging
      }
    }
  }

  // Specialized logging methods for common test activities - These provide context-specific logging
  loginStart(): void {
    // Log when login process begins
    this.info("Starting login process", "LOGIN"); // Info level message with LOGIN context
  }

  loginSuccess(): void {
    // Log when login completes successfully
    this.info("Login completed successfully", "LOGIN"); // Info level message with LOGIN context
  }

  loginFailed(error: Error): void {
    // Log when login fails with error details
    this.error("Login failed", error, "LOGIN"); // Error level message with LOGIN context and error stack
  }

  sessionLoaded(): void {
    // Log when saved session is loaded from file
    this.info("Saved session loaded successfully", "SESSION"); // Info level message with SESSION context
  }

  sessionSaved(): void {
    // Log when session is saved to file
    this.info("Session saved for future use", "SESSION"); // Info level message with SESSION context
  }

  sessionExpired(): void {
    // Log when saved session has expired
    this.warn("Saved session has expired", "SESSION"); // Warning level message with SESSION context
  }

  testStart(testName: string): void {
    // Log when a test begins execution
    this.info(`Starting test: ${testName}`, "TEST"); // Info level message with TEST context and test name
  }

  testEnd(testName: string, duration?: number): void {
    // Log when a test completes
    const durationStr = duration ? ` (${duration}ms)` : ""; // Add duration if provided
    this.info(`Test completed: ${testName}${durationStr}`, "TEST"); // Info level message with TEST context, test name, and optional duration
  }

  recaptchaSolved(): void {
    // Log when reCAPTCHA is successfully solved
    this.info("reCAPTCHA solved successfully", "RECAPTCHA"); // Info level message with RECAPTCHA context
  }

  recaptchaTimeout(): void {
    // Log when reCAPTCHA solving times out
    this.warn("reCAPTCHA solving timed out, continuing anyway", "RECAPTCHA"); // Warning level message with RECAPTCHA context
  }
}

// Export singleton instance - Create one logger instance to be used throughout the application
export const logger = new Logger(); // Create the singleton logger instance
export default logger; // Also export as default for convenient importing
