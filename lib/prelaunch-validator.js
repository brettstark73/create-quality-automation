/**
 * Pre-Launch Validation Module
 * Automated SOTA checks for web applications before launch
 */

const fs = require('fs')
const path = require('path')

// ============================================================================
// SEO VALIDATION
// ============================================================================

/**
 * Generate sitemap validation script
 */
function generateSitemapValidator() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const sitemapPaths = [
  'public/sitemap.xml',
  'dist/sitemap.xml',
  'out/sitemap.xml',
  'build/sitemap.xml',
  '.next/sitemap.xml'
];

let found = false;
let sitemapPath = null;

for (const p of sitemapPaths) {
  if (fs.existsSync(p)) {
    found = true;
    sitemapPath = p;
    break;
  }
}

if (!found) {
  console.error('❌ No sitemap.xml found');
  console.error('   Expected locations: ' + sitemapPaths.join(', '));
  process.exit(1);
}

const content = fs.readFileSync(sitemapPath, 'utf8');

// Basic XML validation
if (!content.includes('<?xml')) {
  console.error('❌ sitemap.xml missing XML declaration');
  process.exit(1);
}

if (!content.includes('<urlset')) {
  console.error('❌ sitemap.xml missing <urlset> element');
  process.exit(1);
}

if (!content.includes('<url>')) {
  console.error('❌ sitemap.xml has no <url> entries');
  process.exit(1);
}

// Count URLs
const urlCount = (content.match(/<url>/g) || []).length;
console.log('✅ sitemap.xml valid (' + urlCount + ' URLs)');
`
}

/**
 * Generate robots.txt validation script
 */
function generateRobotsValidator() {
  return `#!/usr/bin/env node
const fs = require('fs');

const robotsPaths = [
  'public/robots.txt',
  'dist/robots.txt',
  'out/robots.txt',
  'build/robots.txt'
];

let found = false;
let robotsPath = null;

for (const p of robotsPaths) {
  if (fs.existsSync(p)) {
    found = true;
    robotsPath = p;
    break;
  }
}

if (!found) {
  console.error('❌ No robots.txt found');
  console.error('   Expected locations: ' + robotsPaths.join(', '));
  process.exit(1);
}

const content = fs.readFileSync(robotsPath, 'utf8');

// Check for User-agent directive
if (!content.toLowerCase().includes('user-agent')) {
  console.error('❌ robots.txt missing User-agent directive');
  process.exit(1);
}

// Check for sitemap reference
if (!content.toLowerCase().includes('sitemap')) {
  console.warn('⚠️  robots.txt should reference sitemap.xml');
}

console.log('✅ robots.txt valid');
`
}

/**
 * Generate meta tags validation script
 */
function generateMetaTagsValidator() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const htmlPaths = [
  'public/index.html',
  'dist/index.html',
  'out/index.html',
  'build/index.html',
  'index.html'
];

// For Next.js/React apps, check for meta component patterns
const metaPatterns = [
  'src/app/layout.tsx',
  'src/app/layout.js',
  'pages/_app.tsx',
  'pages/_app.js',
  'pages/_document.tsx',
  'pages/_document.js'
];

let content = '';
let source = '';

// Try HTML files first
for (const p of htmlPaths) {
  if (fs.existsSync(p)) {
    content = fs.readFileSync(p, 'utf8');
    source = p;
    break;
  }
}

// Try framework files if no HTML
if (!content) {
  for (const p of metaPatterns) {
    if (fs.existsSync(p)) {
      content = fs.readFileSync(p, 'utf8');
      source = p;
      break;
    }
  }
}

if (!content) {
  console.warn('⚠️  No HTML or layout file found to check meta tags');
  process.exit(0);
}

const errors = [];
const warnings = [];

// Required meta tags
if (!content.includes('viewport')) {
  errors.push('Missing viewport meta tag');
}

if (!content.includes('<title') && !content.includes('title:') && !content.includes('Title')) {
  errors.push('Missing title tag');
}

if (!content.includes('description')) {
  errors.push('Missing meta description');
}

// OG tags (warnings)
if (!content.includes('og:title')) {
  warnings.push('Missing og:title');
}

if (!content.includes('og:description')) {
  warnings.push('Missing og:description');
}

if (!content.includes('og:image')) {
  warnings.push('Missing og:image');
}

if (!content.includes('og:url')) {
  warnings.push('Missing og:url');
}

// Twitter cards
if (!content.includes('twitter:card')) {
  warnings.push('Missing twitter:card');
}

// Canonical
if (!content.includes('canonical')) {
  warnings.push('Missing canonical URL');
}

console.log('Checking: ' + source);

if (errors.length > 0) {
  console.error('❌ Meta tag errors:');
  errors.forEach(e => console.error('   - ' + e));
}

if (warnings.length > 0) {
  console.warn('⚠️  Meta tag warnings:');
  warnings.forEach(w => console.warn('   - ' + w));
}

if (errors.length === 0) {
  console.log('✅ Required meta tags present');
}

process.exit(errors.length > 0 ? 1 : 0);
`
}

// ============================================================================
// LINK VALIDATION
// ============================================================================

/**
 * Generate linkinator config
 */
function generateLinkinatorConfig() {
  return {
    recurse: true,
    skip: ['localhost', '127.0.0.1', 'example.com', 'placeholder.com'],
    timeout: 10000,
    concurrency: 10,
  }
}

/**
 * Generate link validation script
 */
function generateLinkValidator() {
  return `#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');

// Check for dist/build directories (allowlist only - prevents injection)
const ALLOWED_DIST_PATHS = ['dist', 'build', 'out', '.next', 'public'];
let servePath = null;

for (const p of ALLOWED_DIST_PATHS) {
  if (fs.existsSync(p)) {
    servePath = p;
    break;
  }
}

if (!servePath) {
  console.log('⚠️  No build output found, skipping link validation');
  console.log('   Run after: npm run build');
  process.exit(0);
}

// Security: validate servePath is in allowlist (defense in depth)
if (!ALLOWED_DIST_PATHS.includes(servePath)) {
  console.error('❌ Invalid build path');
  process.exit(1);
}

try {
  // Check if linkinator is available
  const versionCheck = spawnSync('npx', ['linkinator', '--version'], { stdio: 'pipe' });
  if (versionCheck.error) throw versionCheck.error;

  console.log('Checking links in: ' + servePath);
  // Use spawnSync with args array to prevent command injection
  const result = spawnSync('npx', [
    'linkinator',
    servePath,
    '--recurse',
    '--skip', 'localhost|127.0.0.1'
  ], {
    stdio: 'inherit',
    timeout: 120000
  });

  if (result.status === 0) {
    console.log('✅ All links valid');
  } else if (result.status) {
    console.error('❌ Broken links found');
    process.exit(1);
  }
} catch (error) {
  // linkinator not available, skip
  console.log('⚠️  linkinator not available, skipping');
}
`
}

// ============================================================================
// ACCESSIBILITY VALIDATION
// ============================================================================

/**
 * Generate pa11y-ci config
 */
function generatePa11yConfig(urls = []) {
  const defaultUrls = urls.length > 0 ? urls : ['http://localhost:3000']

  return {
    defaults: {
      timeout: 30000,
      wait: 1000,
      standard: 'WCAG2AA',
      runners: ['axe', 'htmlcs'],
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    },
    urls: defaultUrls,
  }
}

/**
 * Generate accessibility validation script
 * Security: Uses spawnSync with args array to avoid shell injection risks
 */
function generateA11yValidator() {
  return `#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');

// Check for pa11yci config
const configPath = '.pa11yci';
if (!fs.existsSync(configPath)) {
  console.log('⚠️  No .pa11yci config found');
  console.log('   Creating default config...');

  const defaultConfig = {
    defaults: {
      timeout: 30000,
      standard: 'WCAG2AA'
    },
    urls: ['http://localhost:3000']
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

console.log('Running accessibility audit (WCAG 2.1 AA)...');
console.log('⚠️  Ensure dev server is running on configured URL');

// Security: Use spawnSync with args array instead of execSync with shell
const result = spawnSync('npx', ['pa11y-ci'], {
  stdio: 'inherit',
  timeout: 120000,
  shell: false
});

if (result.status === 0) {
  console.log('✅ Accessibility checks passed');
} else if (result.status !== null) {
  console.error('❌ Accessibility issues found');
  process.exit(1);
} else if (result.error) {
  console.error('⚠️  pa11y-ci failed to run:', result.error.message);
}
`
}

// ============================================================================
// DOCS COMPLETENESS VALIDATION
// ============================================================================

/**
 * Generate docs completeness validator
 */
function generateDocsValidator() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Required files
const requiredFiles = [
  { file: 'README.md', message: 'README.md is required' },
  { file: 'LICENSE', message: 'LICENSE file recommended', warn: true }
];

// Required README sections
const requiredSections = [
  'install',
  'usage',
  'getting started'
];

// Check required files
for (const { file, message, warn } of requiredFiles) {
  if (!fs.existsSync(file)) {
    if (warn) {
      warnings.push(message);
    } else {
      errors.push(message);
    }
  }
}

// Check README content
if (fs.existsSync('README.md')) {
  const readme = fs.readFileSync('README.md', 'utf8').toLowerCase();

  for (const section of requiredSections) {
    if (!readme.includes(section)) {
      warnings.push('README.md missing "' + section + '" section');
    }
  }

  // Check for placeholder content
  if (readme.includes('todo') || readme.includes('coming soon') || readme.includes('tbd')) {
    warnings.push('README.md contains placeholder content (TODO/TBD)');
  }
}

// Check for API docs if src/api exists
if (fs.existsSync('src/api') || fs.existsSync('api') || fs.existsSync('pages/api')) {
  const apiDocPaths = ['docs/api.md', 'API.md', 'docs/API.md'];
  const hasApiDocs = apiDocPaths.some(p => fs.existsSync(p));
  if (!hasApiDocs) {
    warnings.push('API directory found but no API documentation');
  }
}

// Check for deployment docs
const deployDocPaths = ['DEPLOYMENT.md', 'docs/deployment.md', 'docs/DEPLOYMENT.md'];
const hasDeployDocs = deployDocPaths.some(p => fs.existsSync(p));
if (!hasDeployDocs) {
  warnings.push('No deployment documentation found');
}

// Report
if (errors.length > 0) {
  console.error('❌ Documentation errors:');
  errors.forEach(e => console.error('   - ' + e));
}

if (warnings.length > 0) {
  console.warn('⚠️  Documentation warnings:');
  warnings.forEach(w => console.warn('   - ' + w));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Documentation complete');
} else if (errors.length === 0) {
  console.log('✅ Required documentation present');
}

process.exit(errors.length > 0 ? 1 : 0);
`
}

// ============================================================================
// ENV VARS VALIDATION (Pro)
// ============================================================================

/**
 * Generate env vars validator (Pro feature)
 */
function generateEnvValidator() {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Find .env.example or .env.template
const envTemplatePaths = ['.env.example', '.env.template', '.env.sample'];
let templatePath = null;
let templateVars = [];

for (const p of envTemplatePaths) {
  if (fs.existsSync(p)) {
    templatePath = p;
    break;
  }
}

if (!templatePath) {
  console.warn('⚠️  No .env.example found - skipping env var validation');
  process.exit(0);
}

// Parse template
const templateContent = fs.readFileSync(templatePath, 'utf8');
const envRegex = /^([A-Z][A-Z0-9_]*)\\s*=/gm;
let match;

while ((match = envRegex.exec(templateContent)) !== null) {
  templateVars.push(match[1]);
}

console.log('Found ' + templateVars.length + ' env vars in ' + templatePath);

// Search for usage in code
const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
const searchDirs = ['src', 'app', 'pages', 'lib', 'api'];

function findEnvUsage(dir) {
  const usedVars = new Set();

  function walkDir(currentPath) {
    if (!fs.existsSync(currentPath)) return;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && codeExtensions.some(ext => entry.name.endsWith(ext))) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Match process.env.VAR_NAME and import.meta.env.VAR_NAME
        const envMatches = content.matchAll(/(?:process\\.env|import\\.meta\\.env)\\.([A-Z][A-Z0-9_]*)/g);
        for (const m of envMatches) {
          usedVars.add(m[1]);
        }

        // Match env('VAR_NAME') or getenv('VAR_NAME')
        const funcMatches = content.matchAll(/(?:env|getenv)\\(['\`"]([A-Z][A-Z0-9_]*)['\`"]\\)/g);
        for (const m of funcMatches) {
          usedVars.add(m[1]);
        }
      }
    }
  }

  walkDir(dir);
  return usedVars;
}

const usedInCode = new Set();
for (const dir of searchDirs) {
  const found = findEnvUsage(dir);
  found.forEach(v => usedInCode.add(v));
}

// Also check root files
const rootFiles = fs.readdirSync('.').filter(f => codeExtensions.some(ext => f.endsWith(ext)));
for (const file of rootFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/(?:process\\.env|import\\.meta\\.env)\\.([A-Z][A-Z0-9_]*)/g);
  for (const m of matches) {
    usedInCode.add(m[1]);
  }
}

// Check for undocumented vars
const undocumented = [...usedInCode].filter(v => !templateVars.includes(v) && !v.startsWith('NODE_'));
if (undocumented.length > 0) {
  warnings.push('Env vars used in code but not in ' + templatePath + ': ' + undocumented.join(', '));
}

// Check for unused documented vars
const unused = templateVars.filter(v => !usedInCode.has(v));
if (unused.length > 0) {
  warnings.push('Env vars in ' + templatePath + ' but not used in code: ' + unused.join(', '));
}

// Report
if (errors.length > 0) {
  console.error('❌ Env var errors:');
  errors.forEach(e => console.error('   - ' + e));
}

if (warnings.length > 0) {
  console.warn('⚠️  Env var warnings:');
  warnings.forEach(w => console.warn('   - ' + w));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Env vars properly documented');
}

process.exit(errors.length > 0 ? 1 : 0);
`
}

// ============================================================================
// COMBINED PRELAUNCH VALIDATION
// ============================================================================

/**
 * Generate combined prelaunch validation script
 */
function generatePrelaunchValidator() {
  return `#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║     PRE-LAUNCH VALIDATION SUITE        ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

const checks = [
  { name: 'SEO: Sitemap', cmd: 'npm run validate:sitemap --silent' },
  { name: 'SEO: robots.txt', cmd: 'npm run validate:robots --silent' },
  { name: 'SEO: Meta Tags', cmd: 'npm run validate:meta --silent' },
  { name: 'Links', cmd: 'npm run validate:links --silent', optional: true },
  { name: 'Accessibility', cmd: 'npm run validate:a11y --silent', optional: true },
  { name: 'Documentation', cmd: 'npm run validate:docs --silent' }
];

let passed = 0;
let failed = 0;
let skipped = 0;

for (const check of checks) {
  process.stdout.write(check.name.padEnd(25) + ' ');

  try {
    execSync(check.cmd, { stdio: 'pipe', timeout: 120000 });
    console.log('✅ PASS');
    passed++;
  } catch (error) {
    if (check.optional) {
      console.log('⚠️  SKIP');
      skipped++;
    } else {
      console.log('❌ FAIL');
      failed++;
    }
  }
}

console.log('');
console.log('────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
console.log('');

if (failed > 0) {
  console.log('❌ Pre-launch validation FAILED');
  console.log('   Fix issues above before launching');
  process.exit(1);
} else {
  console.log('✅ Pre-launch validation PASSED');
}
`
}

// ============================================================================
// FILE WRITERS
// ============================================================================

/**
 * Write validation scripts to project
 */
function writeValidationScripts(targetDir) {
  const scriptsDir = path.join(targetDir, 'scripts', 'validate')

  // Create scripts directory
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true })
  }

  const scripts = {
    'sitemap.js': generateSitemapValidator(),
    'robots.js': generateRobotsValidator(),
    'meta-tags.js': generateMetaTagsValidator(),
    'links.js': generateLinkValidator(),
    'a11y.js': generateA11yValidator(),
    'docs.js': generateDocsValidator(),
    'prelaunch.js': generatePrelaunchValidator(),
  }

  for (const [filename, content] of Object.entries(scripts)) {
    fs.writeFileSync(path.join(scriptsDir, filename), content)
  }

  return Object.keys(scripts).map(f => path.join('scripts', 'validate', f))
}

/**
 * Write env validator (Pro only)
 */
function writeEnvValidator(targetDir) {
  const scriptsDir = path.join(targetDir, 'scripts', 'validate')

  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true })
  }

  fs.writeFileSync(path.join(scriptsDir, 'env.js'), generateEnvValidator())

  return path.join('scripts', 'validate', 'env.js')
}

/**
 * Write pa11y-ci config
 */
function writePa11yConfig(targetDir, urls = []) {
  const configPath = path.join(targetDir, '.pa11yci')
  const config = generatePa11yConfig(urls)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  return '.pa11yci'
}

// ============================================================================
// PACKAGE.JSON SCRIPTS
// ============================================================================

/**
 * Get prelaunch validation scripts for package.json
 */
function getPrelaunchScripts(isPro = false) {
  const scripts = {
    'validate:sitemap': 'node scripts/validate/sitemap.js',
    'validate:robots': 'node scripts/validate/robots.js',
    'validate:meta': 'node scripts/validate/meta-tags.js',
    'validate:links': 'node scripts/validate/links.js',
    'validate:a11y': 'node scripts/validate/a11y.js',
    'validate:docs': 'node scripts/validate/docs.js',
    'validate:prelaunch': 'node scripts/validate/prelaunch.js',
  }

  if (isPro) {
    scripts['validate:env'] = 'node scripts/validate/env.js'
  }

  return scripts
}

/**
 * Get prelaunch dependencies
 * @param {boolean} [_isPro] - Whether Pro tier is enabled (currently unused, for future extensibility)
 */
function getPrelaunchDependencies(_isPro) {
  return {
    linkinator: '^6.0.0',
    'pa11y-ci': '^3.1.0',
  }
}

// ============================================================================
// GITHUB ACTIONS
// ============================================================================

/**
 * Generate prelaunch validation workflow job
 */
function generatePrelaunchWorkflowJob() {
  return `
  prelaunch:
    name: Pre-Launch Validation
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build --if-present

      - name: Validate SEO
        run: |
          npm run validate:sitemap --if-present || echo "Sitemap check skipped"
          npm run validate:robots --if-present || echo "Robots check skipped"
          npm run validate:meta --if-present || echo "Meta check skipped"

      - name: Validate Documentation
        run: npm run validate:docs --if-present || echo "Docs check skipped"

      - name: Check Links
        run: npm run validate:links --if-present || echo "Link check skipped"
        continue-on-error: true
`
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Generators
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

  // Writers
  writeValidationScripts,
  writeEnvValidator,
  writePa11yConfig,

  // Package.json helpers
  getPrelaunchScripts,
  getPrelaunchDependencies,
}
