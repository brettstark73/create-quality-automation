'use strict'

const fs = require('fs')

/**
 * Documentation Accuracy Validator
 * Validates that documentation matches actual project state
 */
class DocumentationValidator {
  constructor() {
    this.issues = []
  }

  /**
   * Validate all documentation for accuracy
   */
  async validateAll() {
    console.log('📖 Validating documentation accuracy...')

    this.issues = []

    await this.validateReadmeFileReferences()
    await this.validateReadmeScriptReferences()
    await this.validatePackageJsonAlignment()

    if (this.issues.length > 0) {
      console.error(`❌ Found ${this.issues.length} documentation issue(s):`)
      this.issues.forEach(issue => console.error(`   ${issue}`))
      throw new Error('Documentation accuracy validation failed')
    }

    console.log('✅ Documentation accuracy validated')
    return { issues: this.issues, passed: this.issues.length === 0 }
  }

  /**
   * Validate that files mentioned in README actually exist
   */
  async validateReadmeFileReferences() {
    if (!fs.existsSync('README.md')) {
      return // No README to validate
    }

    const readme = fs.readFileSync('README.md', 'utf8')

    // Extract file references (in backticks with extensions)
    const fileReferences =
      readme.match(
        /`[^`]*\.(js|ts|json|md|yml|yaml|tsx|jsx|css|scss|config\.cjs)`/g
      ) || []
    const extractedFiles = fileReferences.map(ref => ref.replace(/`/g, ''))

    for (const file of extractedFiles) {
      // Skip example/placeholder files and template references
      if (
        file.includes('your-project') ||
        file.includes('example') ||
        file.includes('...') ||
        file.includes('quality.yml') || // Template workflow file
        file.includes('quality-python.yml') || // Template workflow file
        file.includes('.pre-commit-config.yaml') || // Template file
        file.includes('.lighthouserc.js') || // Template file
        file.includes('vercel.json') || // Example config
        file.startsWith('.ts') || // File extension examples
        file.startsWith('.tsx') || // File extension examples
        file === 'node setup.js' // CLI command example
      ) {
        continue
      }

      if (!fs.existsSync(file)) {
        this.issues.push(`README.md references missing file: ${file}`)
      }
    }

    // Extract directory references
    const dirReferences = readme.match(/`[^`]*\/[^`]*`/g) || []
    const extractedDirs = dirReferences
      .map(ref => ref.replace(/`/g, ''))
      .filter(dir => !dir.includes('your-project') && !dir.includes('example'))

    for (const dir of extractedDirs) {
      // Check if it's a directory path (ends with /)
      if (dir.endsWith('/') && !fs.existsSync(dir)) {
        this.issues.push(`README.md references missing directory: ${dir}`)
      }
    }
  }

  /**
   * Validate that npm scripts mentioned in README exist
   */
  async validateReadmeScriptReferences() {
    if (!fs.existsSync('README.md') || !fs.existsSync('package.json')) {
      return
    }

    const readme = fs.readFileSync('README.md', 'utf8')
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const availableScripts = Object.keys(packageJson.scripts || {})

    // Extract npm run commands
    const scriptReferences = readme.match(/npm run [a-zA-Z:-]+/g) || []
    const referencedScripts = scriptReferences.map(ref =>
      ref.replace('npm run ', '')
    )

    for (const script of referencedScripts) {
      // Skip template/example scripts that are added to target projects
      if (
        script.startsWith('python:') || // Python scripts are template-only
        script === 'lighthouse:ci' || // Added by templates
        script === 'lighthouse:upload' ||
        script === 'dev' || // Common in target projects
        script === 'start' || // Common in target projects
        script === 'build' // Common in target projects
      ) {
        continue
      }

      if (!availableScripts.includes(script)) {
        this.issues.push(`README.md references missing npm script: ${script}`)
      }
    }

    // Extract npx commands that should be scripts
    const npxReferences = readme.match(/npx [a-zA-Z-]+ [a-zA-Z:-]+/g) || []
    for (const npxRef of npxReferences) {
      if (
        npxRef.includes('eslint') ||
        npxRef.includes('prettier') ||
        npxRef.includes('stylelint')
      ) {
        const suggestedScript = npxRef.replace('npx ', '').replace(' ', ':')
        if (!availableScripts.includes(suggestedScript)) {
          this.issues.push(
            `README.md shows npx command "${npxRef}" - consider adding npm script "${suggestedScript}"`
          )
        }
      }
    }
  }

  /**
   * Validate package.json alignment with documentation
   */
  async validatePackageJsonAlignment() {
    if (!fs.existsSync('package.json')) {
      return
    }

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

    // Check version consistency with CHANGELOG
    if (fs.existsSync('CHANGELOG.md')) {
      const changelog = fs.readFileSync('CHANGELOG.md', 'utf8')
      const version = packageJson.version

      if (
        !changelog.includes(`## [${version}]`) &&
        !changelog.includes(`## [Unreleased]`)
      ) {
        this.issues.push(
          `package.json version ${version} not found in CHANGELOG.md`
        )
      }
    }

    // Check description accuracy
    if (packageJson.description) {
      const description = packageJson.description.toLowerCase()

      // Check for outdated technology mentions
      if (description.includes('javascript') && this.hasTypeScript()) {
        this.issues.push(
          'package.json description mentions "JavaScript" but project uses TypeScript'
        )
      }

      if (!description.includes('python') && this.hasPython()) {
        this.issues.push(
          'package.json description missing "Python" but project has Python files'
        )
      }
    }

    // Check keywords relevance
    if (packageJson.keywords) {
      const keywords = packageJson.keywords

      if (this.hasTypeScript() && !keywords.includes('typescript')) {
        this.issues.push(
          'Consider adding "typescript" to package.json keywords'
        )
      }

      if (this.hasPython() && !keywords.includes('python')) {
        this.issues.push('Consider adding "python" to package.json keywords')
      }

      if (this.hasLighthouse() && !keywords.includes('lighthouse')) {
        this.issues.push(
          'Consider adding "lighthouse" to package.json keywords'
        )
      }
    }
  }

  /**
   * Helper: Check if project uses TypeScript
   */
  hasTypeScript() {
    if (fs.existsSync('tsconfig.json')) return true
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      return !!(pkg.dependencies?.typescript || pkg.devDependencies?.typescript)
    }
    return false
  }

  /**
   * Helper: Check if project has Python files
   */
  hasPython() {
    return (
      fs.existsSync('pyproject.toml') ||
      fs.existsSync('requirements.txt') ||
      fs.existsSync('requirements-dev.txt') ||
      fs.readdirSync('.').some(file => file.endsWith('.py'))
    )
  }

  /**
   * Helper: Check if project has Lighthouse configuration
   */
  hasLighthouse() {
    return (
      fs.existsSync('.lighthouserc.js') ||
      fs.existsSync('.lighthouserc.json') ||
      fs.existsSync('lighthouserc.js')
    )
  }
}

module.exports = { DocumentationValidator }
