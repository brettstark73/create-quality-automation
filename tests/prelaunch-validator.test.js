/**
 * Tests for Pre-Launch Validation Module
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')

const {
  generateSitemapValidator,
  generateRobotsValidator,
  generateMetaTagsValidator,
  generateLinkinatorConfig,
  generateLinkValidator,
  generatePa11yConfig,
  generateA11yValidator,
  generateDocsValidator,
  generateEnvValidator,
  generatePrelaunchValidator,
  generatePrelaunchWorkflowJob,
  writeValidationScripts,
  writeEnvValidator,
  writePa11yConfig,
  getPrelaunchScripts,
  getPrelaunchDependencies,
} = require('../lib/prelaunch-validator')

/**
 * Helper to create a temp directory for testing
 */
function createTempDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-prelaunch-test-'))
  return tmpDir
}

/**
 * Helper to clean up temp directory
 */
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

// Test: generateSitemapValidator returns valid script
;(() => {
  console.log('Testing generateSitemapValidator...')
  const script = generateSitemapValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('sitemap.xml'), 'Should reference sitemap.xml')
  assert(script.includes('<urlset'), 'Should check for urlset element')
  assert(script.includes('process.exit'), 'Should have exit codes')

  console.log('✅ generateSitemapValidator tests passed')
})()

// Test: generateRobotsValidator returns valid script
;(() => {
  console.log('Testing generateRobotsValidator...')
  const script = generateRobotsValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('robots.txt'), 'Should reference robots.txt')
  assert(script.includes('user-agent'), 'Should check for User-agent')
  assert(script.includes('sitemap'), 'Should mention sitemap reference')

  console.log('✅ generateRobotsValidator tests passed')
})()

// Test: generateMetaTagsValidator returns valid script
;(() => {
  console.log('Testing generateMetaTagsValidator...')
  const script = generateMetaTagsValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('viewport'), 'Should check for viewport')
  assert(script.includes('description'), 'Should check for description')
  assert(script.includes('og:title'), 'Should check for og:title')
  assert(script.includes('canonical'), 'Should check for canonical')

  console.log('✅ generateMetaTagsValidator tests passed')
})()

// Test: generateLinkinatorConfig returns valid config
;(() => {
  console.log('Testing generateLinkinatorConfig...')
  const config = generateLinkinatorConfig()

  assert(config.recurse === true, 'Should enable recursion')
  assert(Array.isArray(config.skip), 'Should have skip array')
  assert(config.skip.includes('localhost'), 'Should skip localhost')
  assert(typeof config.timeout === 'number', 'Should have timeout')
  assert(typeof config.concurrency === 'number', 'Should have concurrency')

  console.log('✅ generateLinkinatorConfig tests passed')
})()

// Test: generateLinkValidator returns valid script
;(() => {
  console.log('Testing generateLinkValidator...')
  const script = generateLinkValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('linkinator'), 'Should use linkinator')
  assert(script.includes('--recurse'), 'Should use recurse flag')

  console.log('✅ generateLinkValidator tests passed')
})()

// Test: generatePa11yConfig returns valid config
;(() => {
  console.log('Testing generatePa11yConfig...')

  // Test with default URLs
  const defaultConfig = generatePa11yConfig()
  assert(defaultConfig.defaults.standard === 'WCAG2AA', 'Should use WCAG2AA')
  assert(
    defaultConfig.urls.includes('http://localhost:3000'),
    'Should have default URL'
  )

  // Test with custom URLs
  const customConfig = generatePa11yConfig([
    'http://localhost:3000',
    'http://localhost:3000/about',
  ])
  assert(customConfig.urls.length === 2, 'Should have 2 URLs')

  console.log('✅ generatePa11yConfig tests passed')
})()

// Test: generateA11yValidator returns valid script
;(() => {
  console.log('Testing generateA11yValidator...')
  const script = generateA11yValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('pa11y-ci'), 'Should use pa11y-ci')
  assert(script.includes('WCAG'), 'Should mention WCAG')
  assert(script.includes('.pa11yci'), 'Should reference config file')

  console.log('✅ generateA11yValidator tests passed')
})()

// Test: generateDocsValidator returns valid script
;(() => {
  console.log('Testing generateDocsValidator...')
  const script = generateDocsValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('README.md'), 'Should check for README')
  assert(script.includes('LICENSE'), 'Should check for LICENSE')
  assert(script.includes('install'), 'Should check for install section')
  assert(script.includes('usage'), 'Should check for usage section')

  console.log('✅ generateDocsValidator tests passed')
})()

// Test: generateEnvValidator returns valid script
;(() => {
  console.log('Testing generateEnvValidator...')
  const script = generateEnvValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(script.includes('.env.example'), 'Should check .env.example')
  assert(script.includes('process.env'), 'Should look for process.env usage')
  assert(
    script.includes('import.meta.env'),
    'Should look for import.meta.env usage'
  )

  console.log('✅ generateEnvValidator tests passed')
})()

// Test: generatePrelaunchValidator returns valid script
;(() => {
  console.log('Testing generatePrelaunchValidator...')
  const script = generatePrelaunchValidator()

  assert(script.includes('#!/usr/bin/env node'), 'Should have shebang')
  assert(
    script.includes('PRE-LAUNCH VALIDATION SUITE'),
    'Should have header banner'
  )
  assert(script.includes('validate:sitemap'), 'Should run sitemap check')
  assert(script.includes('validate:robots'), 'Should run robots check')
  assert(script.includes('validate:meta'), 'Should run meta check')
  assert(script.includes('validate:links'), 'Should run links check')
  assert(script.includes('validate:a11y'), 'Should run a11y check')
  assert(script.includes('validate:docs'), 'Should run docs check')
  assert(script.includes('PASS'), 'Should show pass status')
  assert(script.includes('FAIL'), 'Should show fail status')

  console.log('✅ generatePrelaunchValidator tests passed')
})()

// Test: generatePrelaunchWorkflowJob returns valid YAML
;(() => {
  console.log('Testing generatePrelaunchWorkflowJob...')
  const yaml = generatePrelaunchWorkflowJob()

  assert(yaml.includes('prelaunch:'), 'Should have job name')
  assert(yaml.includes('Pre-Launch Validation'), 'Should have job label')
  assert(yaml.includes('ubuntu-latest'), 'Should run on ubuntu')
  assert(yaml.includes('actions/checkout@v4'), 'Should checkout code')
  assert(yaml.includes('actions/setup-node@v4'), 'Should setup node')
  assert(yaml.includes('npm ci'), 'Should install deps')
  assert(yaml.includes('validate:sitemap'), 'Should run sitemap validation')

  console.log('✅ generatePrelaunchWorkflowJob tests passed')
})()

// Test: writeValidationScripts creates all scripts
;(() => {
  console.log('Testing writeValidationScripts...')
  const tmpDir = createTempDir()

  try {
    const scriptsWritten = writeValidationScripts(tmpDir)

    assert(Array.isArray(scriptsWritten), 'Should return array of paths')
    assert(scriptsWritten.length === 7, 'Should write 7 scripts')

    // Check all scripts exist
    const expectedScripts = [
      'sitemap.js',
      'robots.js',
      'meta-tags.js',
      'links.js',
      'a11y.js',
      'docs.js',
      'prelaunch.js',
    ]

    for (const script of expectedScripts) {
      const scriptPath = path.join(tmpDir, 'scripts', 'validate', script)
      assert(fs.existsSync(scriptPath), `Should create ${script}`)
    }

    console.log('✅ writeValidationScripts tests passed')
  } finally {
    cleanupTempDir(tmpDir)
  }
})()

// Test: writeEnvValidator creates env validator script
;(() => {
  console.log('Testing writeEnvValidator...')
  const tmpDir = createTempDir()

  try {
    const scriptPath = writeEnvValidator(tmpDir)

    assert(
      scriptPath.includes('env.js'),
      'Should return path containing env.js'
    )

    const fullPath = path.join(tmpDir, 'scripts', 'validate', 'env.js')
    assert(fs.existsSync(fullPath), 'Should create env.js')

    const content = fs.readFileSync(fullPath, 'utf8')
    assert(content.includes('.env.example'), 'Should check .env.example')

    console.log('✅ writeEnvValidator tests passed')
  } finally {
    cleanupTempDir(tmpDir)
  }
})()

// Test: writePa11yConfig creates config file
;(() => {
  console.log('Testing writePa11yConfig...')
  const tmpDir = createTempDir()

  try {
    const configPath = writePa11yConfig(tmpDir)

    assert(configPath === '.pa11yci', 'Should return config path')

    const fullPath = path.join(tmpDir, '.pa11yci')
    assert(fs.existsSync(fullPath), 'Should create .pa11yci')

    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    assert(content.defaults.standard === 'WCAG2AA', 'Should have WCAG2AA')

    console.log('✅ writePa11yConfig tests passed')
  } finally {
    cleanupTempDir(tmpDir)
  }
})()

// Test: getPrelaunchScripts returns correct scripts for Free tier
;(() => {
  console.log('Testing getPrelaunchScripts (Free tier)...')
  const scripts = getPrelaunchScripts(false)

  assert(typeof scripts['validate:sitemap'] === 'string', 'Should have sitemap')
  assert(typeof scripts['validate:robots'] === 'string', 'Should have robots')
  assert(typeof scripts['validate:meta'] === 'string', 'Should have meta')
  assert(typeof scripts['validate:links'] === 'string', 'Should have links')
  assert(typeof scripts['validate:a11y'] === 'string', 'Should have a11y')
  assert(typeof scripts['validate:docs'] === 'string', 'Should have docs')
  assert(
    typeof scripts['validate:prelaunch'] === 'string',
    'Should have prelaunch'
  )
  assert(
    scripts['validate:env'] === undefined,
    'Free tier should NOT have env validation'
  )

  console.log('✅ getPrelaunchScripts (Free tier) tests passed')
})()

// Test: getPrelaunchScripts returns correct scripts for Pro tier
;(() => {
  console.log('Testing getPrelaunchScripts (Pro tier)...')
  const scripts = getPrelaunchScripts(true)

  assert(typeof scripts['validate:sitemap'] === 'string', 'Should have sitemap')
  assert(typeof scripts['validate:env'] === 'string', 'Pro should have env')

  console.log('✅ getPrelaunchScripts (Pro tier) tests passed')
})()

// Test: getPrelaunchDependencies returns correct dependencies
;(() => {
  console.log('Testing getPrelaunchDependencies...')
  const deps = getPrelaunchDependencies(false)

  assert(typeof deps['linkinator'] === 'string', 'Should have linkinator')
  assert(typeof deps['pa11y-ci'] === 'string', 'Should have pa11y-ci')

  console.log('✅ getPrelaunchDependencies tests passed')
})()

console.log('\n✅ All prelaunch-validator tests passed!')
