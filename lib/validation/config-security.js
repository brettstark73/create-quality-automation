'use strict'

const fs = require('fs')

/**
 * Configuration Security Scanner
 * Scans for security vulnerabilities in configuration files
 */
class ConfigSecurityScanner {
  constructor() {
    this.issues = []
  }

  /**
   * Scan all configuration files for security issues
   */
  async scanAll() {
    console.log('🔍 Scanning configuration for security issues...')

    this.issues = []

    await this.scanNextjsConfig()
    await this.scanViteConfig()
    await this.scanDockerfile()
    await this.scanEnvironmentFiles()

    if (this.issues.length > 0) {
      console.error(
        `❌ Found ${this.issues.length} configuration security issue(s):`
      )
      this.issues.forEach(issue => console.error(`   ${issue}`))
      throw new Error('Configuration security violations detected')
    }

    console.log('✅ Configuration security check passed')
    return { issues: this.issues, passed: this.issues.length === 0 }
  }

  /**
   * Scan Next.js configuration for secret exposure
   */
  async scanNextjsConfig() {
    const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts']

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
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
   * Scan Vite configuration for secret exposure
   */
  async scanViteConfig() {
    const configFiles = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs']

    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
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
  async scanDockerfile() {
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
   * Scan environment files for common issues
   */
  async scanEnvironmentFiles() {
    // Check that .env files are properly ignored
    const envFiles = ['.env', '.env.local', '.env.production']
    const existingEnvFiles = envFiles.filter(file => fs.existsSync(file))

    if (existingEnvFiles.length > 0 && fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8')

      for (const envFile of existingEnvFiles) {
        if (!gitignore.includes(envFile) && !gitignore.includes('.env*')) {
          this.issues.push(
            `${envFile} exists but not in .gitignore. Add it to prevent secret exposure.`
          )
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
