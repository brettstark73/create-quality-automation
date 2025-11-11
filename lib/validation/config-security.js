'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Configuration Security Scanner
 * Uses mature security tools instead of custom regex heuristics
 */
class ConfigSecurityScanner {
  constructor(options = {}) {
    this.issues = []
    this.options = options
  }

  /**
   * Scan all configuration files for security issues
   */
  async scanAll() {
    console.log('🔍 Running security scans with mature tools...')

    this.issues = []

    if (!this.options.disableNpmAudit) {
      await this.runNpmAudit()
    }

    if (!this.options.disableEslintSecurity) {
      await this.runESLintSecurity()
    }

    if (!this.options.disableGitleaks) {
      await this.runGitleaks()
    }

    await this.scanClientSideSecrets()
    await this.scanDockerSecrets()
    await this.scanEnvironmentFiles()
    await this.checkGitignore()

    if (this.issues.length > 0) {
      console.error(`❌ Found ${this.issues.length} security issue(s):`)
      this.issues.forEach(issue => console.error(`   ${issue}`))
      throw new Error('Security violations detected')
    }

    console.log('✅ Security checks passed')
    return { issues: this.issues, passed: this.issues.length === 0 }
  }

  /**
   * Run npm audit for dependency vulnerabilities
   */
  async runNpmAudit() {
    if (!fs.existsSync('package.json')) return

    try {
      // Run npm audit and capture high/critical vulnerabilities
      execSync('npm audit --audit-level high --json', { stdio: 'pipe' })
    } catch (error) {
      // npm audit exits with code 1 when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout.toString())
          if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
            const vulns = auditResult.metadata.vulnerabilities
            const total = vulns.high + vulns.critical + vulns.moderate
            if (total > 0) {
              this.issues.push(
                `npm audit: ${total} vulnerabilities found (${vulns.high} high, ${vulns.critical} critical). Run 'npm audit fix' to resolve.`
              )
            }
          }
        } catch {
          console.warn('Could not parse npm audit output')
        }
      }
    }
  }

  /**
   * Run gitleaks for comprehensive secret scanning
   */
  async runGitleaks() {
    try {
      // Run gitleaks via npx (works with local and global installs, cross-platform)
      execSync('npx gitleaks detect --source . --verbose', { stdio: 'pipe' })
    } catch (error) {
      if (error.status === 1) {
        // Gitleaks found secrets (exit code 1)
        const output = error.stdout
          ? error.stdout.toString()
          : error.stderr
            ? error.stderr.toString()
            : ''
        if (output.includes('leaks found')) {
          this.issues.push(
            'gitleaks: Potential secrets detected in repository. Run "gitleaks detect" for details.'
          )
        }
      } else {
        // Other errors (missing binary, permission issues, etc.)
        const stderr = error.stderr ? error.stderr.toString() : ''
        const stdout = error.stdout ? error.stdout.toString() : ''
        const output = stderr || stdout || error.message

        if (
          output.includes('not found') ||
          output.includes('command not found') ||
          output.includes('ENOENT') ||
          error.code === 'ENOENT'
        ) {
          // Missing gitleaks should block security validation, not silently pass
          this.issues.push(
            'gitleaks: Tool not found. Install gitleaks for comprehensive secret scanning or use --no-gitleaks to skip.'
          )
        } else {
          // Log the actual error so users know gitleaks failed to run
          console.warn(`⚠️ gitleaks failed to run: ${output.split('\n')[0]}`)
          this.issues.push(
            `gitleaks: Failed to run - ${output.split('\n')[0]}. Install gitleaks for secret scanning.`
          )
        }
      }
    }
  }

  /**
   * Run ESLint with security rules using programmatic API
   */
  async runESLintSecurity() {
    // Detect which ESLint config file exists (check all variants)
    let eslintConfigPath = null
    const configVariants = [
      'eslint.config.cjs',
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.ts.cjs', // TypeScript projects
    ]

    for (const configFile of configVariants) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(configFile)) {
        eslintConfigPath = path.resolve(configFile)
        break
      }
    }

    if (!eslintConfigPath) {
      return // No ESLint config found
    }

    try {
      // Try to load ESLint programmatically
      const { ESLint } = require('eslint')

      // Create ESLint instance with detected config
      const eslint = new ESLint({
        overrideConfigFile: eslintConfigPath,
      })

      // Lint files in current directory
      const results = await eslint.lintFiles(['.'])

      // Filter for security plugin violations
      const securityIssues = []
      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId && message.ruleId.startsWith('security/')) {
            securityIssues.push({
              file: result.filePath,
              line: message.line,
              column: message.column,
              rule: message.ruleId,
              message: message.message,
              severity: message.severity,
            })
          }
        }
      }

      // Report security issues
      if (securityIssues.length > 0) {
        securityIssues.forEach(issue => {
          const relativePath = path.relative(process.cwd(), issue.file)
          this.issues.push(
            `ESLint Security: ${relativePath}:${issue.line}:${issue.column} - ${issue.message} (${issue.rule})`
          )
        })
      }
    } catch (error) {
      // Check if ESLint is not installed
      if (
        error.code === 'MODULE_NOT_FOUND' ||
        error.message.includes('Cannot find module')
      ) {
        this.issues.push(
          'ESLint Security: ESLint is not installed or cannot be loaded. ' +
            'Install eslint and eslint-plugin-security to enable security validation, or use --no-eslint-security to skip.'
        )
        return
      }

      // Check if config file has syntax errors
      if (error.name === 'SyntaxError' || error.message.includes('parse')) {
        this.issues.push(
          `ESLint Security: ESLint configuration file has errors: ${error.message}. ` +
            'Fix the configuration or use --no-eslint-security to skip.'
        )
        return
      }

      // Other ESLint errors
      this.issues.push(
        `ESLint Security: ESLint failed with error: ${error.message}. ` +
          'Review the error and fix the issue, or use --no-eslint-security to skip.'
      )
    }
  }

  /**
   * Scan for client-side secret exposure in Next.js and Vite
   */
  async scanClientSideSecrets() {
    await this.scanNextjsConfig()
    await this.scanViteConfig()
  }

  /**
   * Scan Next.js configuration for client-side secret exposure
   */
  async scanNextjsConfig() {
    const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts']

    for (const configFile of configFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(configFile)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = fs.readFileSync(configFile, 'utf8')

        // Check for secrets in env block (client-side exposure risk)
        const envBlockRegex = /env:\s*\{([^}]+)\}/gi
        let match

        while ((match = envBlockRegex.exec(content)) !== null) {
          const envBlock = match[1]

          const secretPatterns = [
            { pattern: /\b\w*SECRET\w*\b/gi, type: 'SECRET' },
            { pattern: /\b\w*PASSWORD\w*\b/gi, type: 'PASSWORD' },
            { pattern: /\b\w*PRIVATE\w*\b/gi, type: 'PRIVATE' },
            { pattern: /\b\w*API_KEY\w*\b/gi, type: 'API_KEY' },
            { pattern: /\b\w*_KEY\b/gi, type: 'KEY' },
            { pattern: /\b\w*TOKEN\w*\b/gi, type: 'TOKEN' },
            { pattern: /\b\w*WEBHOOK\w*\b/gi, type: 'WEBHOOK' },
          ]

          for (const { pattern, type } of secretPatterns) {
            if (pattern.test(envBlock)) {
              this.issues.push(
                `${configFile}: Potential ${type} exposure in env block. ` +
                  `Variables in 'env' are sent to client bundle. ` +
                  `Use process.env.${type} server-side instead.`
              )
            }
          }
        }
      }
    }
  }

  /**
   * Scan Vite configuration for client-side secret exposure
   */
  async scanViteConfig() {
    const configFiles = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs']

    for (const configFile of configFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(configFile)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const content = fs.readFileSync(configFile, 'utf8')

        // VITE_ prefixed variables are automatically exposed to client
        const viteSecretPattern =
          /VITE_[^=]*(?:SECRET|PASSWORD|PRIVATE|KEY|TOKEN)/gi
        const matches = content.match(viteSecretPattern)

        if (matches && matches.length > 0) {
          this.issues.push(
            `${configFile}: VITE_ prefixed secrets detected: ${matches.join(', ')}. ` +
              `All VITE_ variables are exposed to client bundle!`
          )
        }
      }
    }
  }

  /**
   * Scan Dockerfile for hardcoded secrets
   */
  async scanDockerSecrets() {
    if (fs.existsSync('Dockerfile')) {
      const content = fs.readFileSync('Dockerfile', 'utf8')

      // Check for hardcoded secrets in ENV statements
      const envStatements = content.match(/^ENV\s+.+$/gim) || []

      for (const envStatement of envStatements) {
        const secretPattern =
          /(?:SECRET|PASSWORD|KEY|TOKEN)\s*=\s*["']?[^"\s']+/gi
        if (secretPattern.test(envStatement)) {
          this.issues.push(
            `Dockerfile: Hardcoded secret in ENV statement: ${envStatement.trim()}`
          )
        }
      }
    }
  }

  /**
   * Check .gitignore for security-sensitive files
   */
  async checkGitignore() {
    if (!fs.existsSync('.gitignore')) {
      this.issues.push(
        'No .gitignore found. Create one to prevent committing sensitive files.'
      )
      return
    }

    const gitignore = fs.readFileSync('.gitignore', 'utf8')
    const requiredIgnores = ['.env*', 'node_modules', '*.log']

    for (const pattern of requiredIgnores) {
      if (!gitignore.includes(pattern)) {
        this.issues.push(`Missing '${pattern}' in .gitignore`)
      }
    }
  }

  /**
   * Scan environment files for common issues
   */
  async scanEnvironmentFiles() {
    // Check that .env files are properly ignored
    const envFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.development',
    ]
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const existingEnvFiles = envFiles.filter(file => fs.existsSync(file))

    if (existingEnvFiles.length > 0) {
      if (!fs.existsSync('.gitignore')) {
        this.issues.push('Environment files found but no .gitignore exists')
      } else {
        const gitignore = fs.readFileSync('.gitignore', 'utf8')
        for (const envFile of existingEnvFiles) {
          if (!gitignore.includes(envFile) && !gitignore.includes('.env*')) {
            this.issues.push(
              `${envFile} exists but not in .gitignore. Add it to prevent secret exposure.`
            )
          }
        }
      }
    }

    // Check for .env.example without corresponding documentation
    if (fs.existsSync('.env.example') && !fs.existsSync('README.md')) {
      this.issues.push(
        '.env.example exists but no README.md to document required variables'
      )
    }
  }
}

module.exports = { ConfigSecurityScanner }
