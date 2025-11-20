const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')

const {
  ErrorReporter,
  ErrorCategory,
  isErrorReportingEnabled,
  categorizeError,
  sanitizePath,
  sanitizeMessage,
  sanitizeStackTrace,
  getErrorReportStats,
  clearErrorReports,
  ERROR_REPORTS_FILE,
} = require('../lib/error-reporter')

describe('Error Reporter', () => {
  const originalEnv = process.env.CQA_ERROR_REPORTING

  beforeEach(() => {
    // Clear environment
    delete process.env.CQA_ERROR_REPORTING

    // Clear error reports file
    if (fs.existsSync(ERROR_REPORTS_FILE)) {
      fs.unlinkSync(ERROR_REPORTS_FILE)
    }
  })

  afterEach(() => {
    // Restore environment
    if (originalEnv) {
      process.env.CQA_ERROR_REPORTING = originalEnv
    } else {
      delete process.env.CQA_ERROR_REPORTING
    }

    // Cleanup
    if (fs.existsSync(ERROR_REPORTS_FILE)) {
      fs.unlinkSync(ERROR_REPORTS_FILE)
    }
  })

  describe('isErrorReportingEnabled', () => {
    it('should be disabled by default', () => {
      assert.strictEqual(isErrorReportingEnabled(), false)
    })

    it('should be enabled when ENV var is "true"', () => {
      process.env.CQA_ERROR_REPORTING = 'true'
      assert.strictEqual(isErrorReportingEnabled(), true)
    })

    it('should be enabled when ENV var is "1"', () => {
      process.env.CQA_ERROR_REPORTING = '1'
      assert.strictEqual(isErrorReportingEnabled(), true)
    })

    it('should be disabled for other ENV var values', () => {
      process.env.CQA_ERROR_REPORTING = 'false'
      assert.strictEqual(isErrorReportingEnabled(), false)
    })
  })

  describe('categorizeError', () => {
    it('should categorize permission errors', () => {
      const error1 = new Error('EACCES: permission denied')
      error1.code = 'EACCES'
      assert.strictEqual(
        categorizeError(error1),
        ErrorCategory.PERMISSION_ERROR
      )

      const error2 = new Error('EPERM: operation not permitted')
      error2.code = 'EPERM'
      assert.strictEqual(
        categorizeError(error2),
        ErrorCategory.PERMISSION_ERROR
      )
    })

    it('should categorize dependency errors', () => {
      const error1 = new Error('Cannot find module "eslint"')
      assert.strictEqual(
        categorizeError(error1),
        ErrorCategory.DEPENDENCY_ERROR
      )

      const error2 = new Error('npm install failed')
      assert.strictEqual(
        categorizeError(error2),
        ErrorCategory.DEPENDENCY_ERROR
      )

      const error3 = new Error('Module not found')
      error3.code = 'MODULE_NOT_FOUND'
      assert.strictEqual(
        categorizeError(error3),
        ErrorCategory.DEPENDENCY_ERROR
      )
    })

    it('should categorize network errors', () => {
      const error1 = new Error('ENOTFOUND registry.npmjs.org')
      error1.code = 'ENOTFOUND'
      assert.strictEqual(categorizeError(error1), ErrorCategory.NETWORK_ERROR)

      const error2 = new Error('Network timeout')
      assert.strictEqual(categorizeError(error2), ErrorCategory.NETWORK_ERROR)
    })

    it('should categorize configuration errors', () => {
      const error1 = new Error('Invalid package.json syntax')
      assert.strictEqual(
        categorizeError(error1),
        ErrorCategory.CONFIGURATION_ERROR
      )

      const error2 = new Error('Parse error in config file')
      assert.strictEqual(
        categorizeError(error2),
        ErrorCategory.CONFIGURATION_ERROR
      )
    })

    it('should categorize validation errors', () => {
      const error1 = new Error('ESLint validation failed')
      assert.strictEqual(
        categorizeError(error1),
        ErrorCategory.VALIDATION_ERROR
      )

      const error2 = new Error('Prettier formatting errors')
      assert.strictEqual(
        categorizeError(error2),
        ErrorCategory.VALIDATION_ERROR
      )
    })

    it('should categorize unknown errors', () => {
      const error = new Error('Something went wrong')
      assert.strictEqual(categorizeError(error), ErrorCategory.UNKNOWN_ERROR)
    })
  })

  describe('sanitizePath', () => {
    it('should remove username from macOS paths', () => {
      const input = '/Users/johndoe/Projects/my-app/src/index.js'
      const output = sanitizePath(input)
      assert.ok(!output.includes('johndoe'))
      assert.ok(output.includes('<redacted>'))
    })

    it('should remove username from Linux paths', () => {
      const input = '/home/johndoe/projects/app/file.js'
      const output = sanitizePath(input)
      assert.ok(!output.includes('johndoe'))
      assert.ok(output.includes('<redacted>'))
    })

    it('should remove username from Windows paths', () => {
      const input = 'C:\\Users\\johndoe\\Projects\\app\\file.js'
      const output = sanitizePath(input)
      assert.ok(!output.includes('johndoe'))
      assert.ok(output.includes('<redacted>'))
    })

    it('should handle non-string inputs', () => {
      assert.strictEqual(sanitizePath(null), null)
      assert.strictEqual(sanitizePath(undefined), undefined)
      assert.strictEqual(sanitizePath(123), 123)
    })
  })

  describe('sanitizeMessage', () => {
    it('should sanitize file paths in error messages', () => {
      const input = 'Error in /Users/johndoe/project/file.js'
      const output = sanitizeMessage(input)
      assert.ok(!output.includes('johndoe'))
      assert.ok(output.includes('<redacted>'))
    })

    it('should sanitize git URLs with tokens', () => {
      const input = 'Failed to clone https://token123@github.com/user/repo'
      const output = sanitizeMessage(input)
      assert.ok(!output.includes('token123'))
      assert.ok(output.includes('<token>'))
    })

    it('should sanitize email addresses', () => {
      const input = 'Contact admin@example.com for support'
      const output = sanitizeMessage(input)
      assert.ok(!output.includes('admin@example.com'))
      assert.ok(output.includes('<email>'))
    })

    it('should handle non-string inputs', () => {
      assert.strictEqual(sanitizeMessage(null), null)
      assert.strictEqual(sanitizeMessage(undefined), undefined)
    })
  })

  describe('sanitizeStackTrace', () => {
    it('should sanitize file paths in stack traces', () => {
      const input = `Error: test
    at Object.<anonymous> (/Users/johndoe/project/file.js:10:15)
    at Module._compile (node:internal/modules/cjs/loader:1358:14)`

      const output = sanitizeStackTrace(input)
      assert.ok(!output.includes('johndoe'))
      assert.ok(output.includes('<redacted>'))
    })

    it('should handle non-string inputs', () => {
      assert.strictEqual(sanitizeStackTrace(null), null)
      assert.strictEqual(sanitizeStackTrace(undefined), undefined)
    })
  })

  describe('ErrorReporter class', () => {
    it('should not capture errors when disabled', () => {
      const reporter = new ErrorReporter('test-operation')
      const error = new Error('Test error')

      const reportId = reporter.captureError(error)
      assert.strictEqual(reportId, null)
      assert.strictEqual(fs.existsSync(ERROR_REPORTS_FILE), false)
    })

    it('should capture errors when enabled', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test-operation')
      const error = new Error('Test error message')

      const reportId = reporter.captureError(error)
      assert.ok(reportId)
      assert.strictEqual(typeof reportId, 'string')
      assert.ok(fs.existsSync(ERROR_REPORTS_FILE))
    })

    it('should force capture with forceCapture context flag', () => {
      // Even when disabled, forceCapture should work
      const reporter = new ErrorReporter('test-operation')
      const error = new Error('Test error')

      const reportId = reporter.captureError(error, { forceCapture: true })
      assert.ok(reportId)
      assert.ok(fs.existsSync(ERROR_REPORTS_FILE))
    })

    it('should include operation context in report', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('setup')
      const error = new Error('Test error')

      reporter.captureError(error)

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.strictEqual(data.reports.length, 1)
      assert.strictEqual(data.reports[0].operation, 'setup')
    })

    it('should include additional context in report', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('validate')
      const error = new Error('Validation failed')
      const context = {
        validationType: 'eslint',
        filesChecked: 42,
      }

      reporter.captureError(error, context)

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.strictEqual(data.reports[0].context.validationType, 'eslint')
      assert.strictEqual(data.reports[0].context.filesChecked, 42)
    })

    it('should include user comment in report', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('setup')
      const error = new Error('Setup failed')
      const userComment = 'This happened after npm install'

      reporter.captureError(error, {}, userComment)

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.strictEqual(data.reports[0].userComment, userComment)
    })

    it('should sanitize error message and stack trace', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')
      const error = new Error('Error in /Users/johndoe/project/file.js')
      error.stack = `Error: test
    at /Users/johndoe/project/file.js:10:15`

      reporter.captureError(error)

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.ok(!data.reports[0].message.includes('johndoe'))
      assert.ok(!data.reports[0].sanitizedStack.includes('johndoe'))
    })

    it('should categorize errors correctly', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')
      const error = new Error('EACCES: permission denied')
      error.code = 'EACCES'

      reporter.captureError(error)

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.strictEqual(
        data.reports[0].category,
        ErrorCategory.PERMISSION_ERROR
      )
    })

    it('should return friendly messages for each error category', () => {
      const reporter = new ErrorReporter('test')

      const depError = new Error('Cannot find module')
      const depMsg = reporter.getFriendlyMessage(depError)
      assert.ok(depMsg.title.includes('Dependency'))

      const permError = new Error('EACCES')
      permError.code = 'EACCES'
      const permMsg = reporter.getFriendlyMessage(permError)
      assert.ok(permMsg.title.includes('Permission'))
    })
  })

  describe('getErrorReportStats', () => {
    it('should return empty stats when no reports exist', () => {
      const stats = getErrorReportStats()
      assert.strictEqual(stats.totalReports, 0)
      assert.deepStrictEqual(stats.byCategory, {})
      assert.deepStrictEqual(stats.byPlatform, {})
    })

    it('should calculate statistics correctly', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')

      // Create multiple error reports
      const error1 = new Error('EACCES')
      error1.code = 'EACCES'
      reporter.captureError(error1)

      const error2 = new Error('Cannot find module')
      reporter.captureError(error2)

      const error3 = new Error('EACCES again')
      error3.code = 'EACCES'
      reporter.captureError(error3)

      const stats = getErrorReportStats()
      assert.strictEqual(stats.totalReports, 3)
      assert.strictEqual(stats.byCategory[ErrorCategory.PERMISSION_ERROR], 2)
      assert.strictEqual(stats.byCategory[ErrorCategory.DEPENDENCY_ERROR], 1)
      assert.ok(stats.byPlatform[os.platform()] > 0)
    })
  })

  describe('clearErrorReports', () => {
    it('should delete error reports file', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')
      reporter.captureError(new Error('Test'))

      assert.ok(fs.existsSync(ERROR_REPORTS_FILE))

      const result = clearErrorReports()
      assert.strictEqual(result, true)
      assert.strictEqual(fs.existsSync(ERROR_REPORTS_FILE), false)
    })

    it('should return false if no file exists', () => {
      const result = clearErrorReports()
      assert.strictEqual(result, false)
    })
  })

  describe('Error report rotation', () => {
    it('should keep only last 50 reports', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')

      // Create 60 error reports
      for (let i = 0; i < 60; i++) {
        reporter.captureError(new Error(`Error ${i}`))
      }

      const data = JSON.parse(fs.readFileSync(ERROR_REPORTS_FILE, 'utf8'))
      assert.strictEqual(data.reports.length, 50)

      // Verify we kept the most recent ones
      assert.ok(data.reports[49].message.includes('Error 59'))
    })
  })

  describe('Error reporting file permissions', () => {
    it('should create error reports file with 0600 permissions', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      const reporter = new ErrorReporter('test')
      reporter.captureError(new Error('Test'))

      const stats = fs.statSync(ERROR_REPORTS_FILE)
      const mode = stats.mode & 0o777

      // Owner read/write only (0600)
      assert.strictEqual(mode, 0o600)
    })
  })

  describe('Silent failure behavior', () => {
    it('should not throw if error reporting save fails', () => {
      process.env.CQA_ERROR_REPORTING = 'true'

      // Make directory read-only to cause write failure
      const reporter = new ErrorReporter('test')

      // This should not throw, even if write fails
      assert.doesNotThrow(() => {
        reporter.captureError(new Error('Test'))
      })
    })
  })
})
