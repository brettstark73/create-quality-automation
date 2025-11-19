/**
 * Premium Dependency Monitoring Library (Pro/Enterprise Tiers)
 * Framework-aware dependency grouping with intelligent batching
 *
 * @module dependency-monitoring-premium
 * @requires lib/licensing.js - License tier validation
 * @requires lib/dependency-monitoring-basic.js - Fallback for free tier
 */

/* eslint-disable security/detect-non-literal-fs-filename */

const fs = require('fs')
const path = require('path')
const { getLicenseInfo } = require('./licensing')
const {
  generateBasicDependabotConfig,
} = require('./dependency-monitoring-basic')

/**
 * npm Framework signature patterns for detection
 * Maps framework names to dependency patterns that indicate their presence
 */
const NPM_FRAMEWORK_SIGNATURES = {
  react: {
    core: ['react', 'react-dom'],
    routing: ['react-router', 'react-router-dom', '@tanstack/react-router'],
    state: ['zustand', 'jotai', 'redux', '@reduxjs/toolkit'],
    query: ['@tanstack/react-query', 'swr'],
    forms: ['react-hook-form', 'formik'],
    ui: [
      '@mui/material',
      '@chakra-ui/react',
      '@radix-ui/react-*',
      '@headlessui/react',
    ],
    metaFrameworks: ['next', 'remix', 'gatsby'],
  },
  vue: {
    core: ['vue'],
    routing: ['vue-router'],
    state: ['pinia', 'vuex'],
    ecosystem: ['@vue/*', 'vueuse'],
    ui: ['vuetify', 'element-plus', '@vueuse/core'],
    metaFrameworks: ['nuxt'],
  },
  angular: {
    core: ['@angular/core', '@angular/common', '@angular/platform-browser'],
    routing: ['@angular/router'],
    forms: ['@angular/forms'],
    http: ['@angular/common/http'],
    state: ['@ngrx/*', '@ngxs/*'],
    ui: ['@angular/material', '@ng-bootstrap/ng-bootstrap'],
    cli: ['@angular/cli', '@angular-devkit/*'],
  },
  svelte: {
    core: ['svelte'],
    metaFrameworks: ['@sveltejs/kit'],
  },
  testing: {
    frameworks: [
      'jest',
      'vitest',
      '@testing-library/*',
      'playwright',
      '@playwright/test',
    ],
  },
  build: {
    tools: ['vite', 'webpack', 'turbo', 'nx', '@nx/*', 'esbuild', 'rollup'],
  },
  storybook: {
    core: ['@storybook/*'],
  },
}

/**
 * Python Framework signature patterns for pip ecosystem
 */
const PYTHON_FRAMEWORK_SIGNATURES = {
  django: {
    core: ['django'],
    rest: ['djangorestframework', 'django-rest-framework'],
    async: ['channels', 'django-channels'],
    cms: ['wagtail', 'django-cms'],
  },
  flask: {
    core: ['flask'],
    extensions: ['flask-sqlalchemy', 'flask-restful', 'flask-cors'],
  },
  fastapi: {
    core: ['fastapi'],
    async: ['uvicorn', 'starlette'],
    validation: ['pydantic'],
  },
  datascience: {
    core: ['numpy', 'pandas', 'scipy'],
    ml: ['scikit-learn', 'tensorflow', 'torch', 'pytorch'],
    viz: ['matplotlib', 'seaborn', 'plotly'],
  },
  testing: {
    frameworks: ['pytest', 'unittest2', 'nose2'],
    helpers: ['pytest-*', 'coverage'],
  },
  web: {
    servers: ['gunicorn', 'uwsgi'],
    async: ['aiohttp', 'tornado'],
  },
}

/**
 * Rust Framework signature patterns for cargo ecosystem
 */
const RUST_FRAMEWORK_SIGNATURES = {
  actix: {
    core: ['actix-web', 'actix-rt'],
    middleware: ['actix-cors', 'actix-session'],
  },
  rocket: {
    core: ['rocket'],
    features: ['rocket_contrib'],
  },
  async: {
    runtime: ['tokio', 'async-std'],
    helpers: ['futures'],
  },
  serde: {
    core: ['serde', 'serde_json'],
    formats: ['serde_yaml', 'serde_derive'],
  },
  testing: {
    frameworks: ['criterion', 'proptest'],
  },
}

/**
 * Ruby Framework signature patterns for bundler ecosystem
 */
const RUBY_FRAMEWORK_SIGNATURES = {
  rails: {
    core: ['rails'],
    database: ['activerecord', 'pg', 'mysql2'],
    testing: ['rspec-rails', 'factory_bot_rails'],
    frontend: ['webpacker', 'importmap-rails'],
  },
  sinatra: {
    core: ['sinatra'],
    extensions: ['sinatra-contrib'],
  },
  testing: {
    frameworks: ['rspec', 'rspec-*', 'minitest'],
    helpers: ['capybara', 'factory_bot', 'factory_bot_*'],
  },
  utilities: {
    async: ['sidekiq', 'delayed_job'],
    http: ['faraday', 'httparty'],
  },
}

/**
 * Detect frameworks and libraries present in a project
 *
 * @param {Object} packageJson - Parsed package.json content
 * @returns {Object} Framework detection results
 * @example
 * {
 *   primary: 'react',
 *   detected: {
 *     react: { present: true, packages: ['react', 'react-dom'], version: '^18.0.0' },
 *     testing: { present: true, packages: ['jest', '@testing-library/react'] }
 *   }
 * }
 */
function detectFrameworks(packageJson) {
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }

  const detectionResults = {
    primary: null,
    detected: {},
  }

  // Iterate through each framework signature
  for (const [frameworkName, categories] of Object.entries(
    NPM_FRAMEWORK_SIGNATURES
  )) {
    const matchedPackages = []
    let frameworkVersion = null

    // Check all categories for this framework
    for (const categoryPackages of Object.values(categories)) {
      for (const pattern of categoryPackages) {
        // Check for exact matches or wildcard patterns
        for (const [depName, depVersion] of Object.entries(allDependencies)) {
          if (matchesPattern(depName, pattern)) {
            matchedPackages.push(depName)
            // Capture version from core package if available
            if (
              !frameworkVersion &&
              categories.core &&
              categories.core.includes(pattern)
            ) {
              frameworkVersion = depVersion
            }
          }
        }
      }
    }

    if (matchedPackages.length > 0) {
      // eslint-disable-next-line security/detect-object-injection
      detectionResults.detected[frameworkName] = {
        present: true,
        packages: matchedPackages,
        version: frameworkVersion,
        count: matchedPackages.length,
      }

      // Set primary framework (first UI framework detected)
      if (
        !detectionResults.primary &&
        ['react', 'vue', 'angular', 'svelte'].includes(frameworkName)
      ) {
        detectionResults.primary = frameworkName
      }
    }
  }

  return detectionResults
}

/**
 * Check if a dependency name matches a pattern (supports wildcards)
 *
 * @param {string} depName - Dependency name to check
 * @param {string} pattern - Pattern to match (supports * wildcard)
 * @returns {boolean} True if matches
 */
function matchesPattern(depName, pattern) {
  if (pattern.includes('*')) {
    // Convert wildcard pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*')
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(depName)
  }
  return depName === pattern
}

/**
 * Generate dependency groups for React ecosystem
 *
 * @param {Object} _frameworkInfo - React detection results (unused, reserved for future enhancements)
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateReactGroups(_frameworkInfo) {
  const groups = {}

  // React core group - highest priority, most critical updates
  groups['react-core'] = {
    patterns: ['react', 'react-dom', 'react-router*'],
    'update-types': ['minor', 'patch'],
    'dependency-type': 'production',
  }

  // React ecosystem - state management, data fetching
  groups['react-ecosystem'] = {
    patterns: ['@tanstack/*', 'zustand', 'jotai', 'swr', '@reduxjs/*'],
    'update-types': ['patch'],
    'dependency-type': 'production',
  }

  // React UI libraries
  groups['react-ui'] = {
    patterns: ['@mui/*', '@chakra-ui/*', '@radix-ui/*', '@headlessui/react'],
    'update-types': ['patch'],
  }

  // React forms
  groups['react-forms'] = {
    patterns: ['react-hook-form', 'formik'],
    'update-types': ['minor', 'patch'],
  }

  return groups
}

/**
 * Generate dependency groups for Vue ecosystem
 *
 * @param {Object} frameworkInfo - Vue detection results
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateVueGroups(_frameworkInfo) {
  const groups = {}

  groups['vue-core'] = {
    patterns: ['vue', 'vue-router', 'pinia'],
    'update-types': ['minor', 'patch'],
    'dependency-type': 'production',
  }

  groups['vue-ecosystem'] = {
    patterns: ['@vue/*', '@vueuse/*', 'vueuse'],
    'update-types': ['patch'],
  }

  groups['vue-ui'] = {
    patterns: ['vuetify', 'element-plus'],
    'update-types': ['patch'],
  }

  return groups
}

/**
 * Generate dependency groups for Angular ecosystem
 *
 * @param {Object} frameworkInfo - Angular detection results
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateAngularGroups(_frameworkInfo) {
  const groups = {}

  groups['angular-core'] = {
    patterns: ['@angular/core', '@angular/common', '@angular/platform-*'],
    'update-types': ['minor', 'patch'],
    'dependency-type': 'production',
  }

  groups['angular-ecosystem'] = {
    patterns: ['@angular/*', '@ngrx/*', '@ngxs/*'],
    'update-types': ['patch'],
  }

  groups['angular-ui'] = {
    patterns: ['@angular/material', '@ng-bootstrap/*'],
    'update-types': ['patch'],
  }

  return groups
}

/**
 * Generate dependency groups for testing frameworks
 *
 * @param {Object} frameworkInfo - Testing framework detection results
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateTestingGroups(_frameworkInfo) {
  const groups = {}

  groups['testing-frameworks'] = {
    patterns: [
      'jest',
      'vitest',
      '@testing-library/*',
      'playwright',
      '@playwright/*',
    ],
    'update-types': ['minor', 'patch'],
    'dependency-type': 'development',
  }

  return groups
}

/**
 * Generate dependency groups for build tools
 *
 * @param {Object} frameworkInfo - Build tool detection results
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateBuildToolGroups(_frameworkInfo) {
  const groups = {}

  groups['build-tools'] = {
    patterns: ['vite', 'webpack', 'turbo', '@nx/*', 'esbuild', 'rollup'],
    'update-types': ['patch'],
    'dependency-type': 'development',
  }

  return groups
}

/**
 * Generate Storybook dependency groups
 *
 * @param {Object} frameworkInfo - Storybook detection results
 * @returns {Object} Dependabot groups configuration
 */
/* eslint-disable no-unused-vars */
function generateStorybookGroups(_frameworkInfo) {
  const groups = {}

  groups['storybook'] = {
    patterns: ['@storybook/*'],
    'update-types': ['minor', 'patch'],
    'dependency-type': 'development',
  }

  return groups
}

/**
 * ============================================================================
 * PYTHON/PIP ECOSYSTEM SUPPORT
 * ============================================================================
 */

/**
 * Check if project has Python dependencies
 */
function hasPythonProject(projectPath) {
  return (
    fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
    fs.existsSync(path.join(projectPath, 'Pipfile')) ||
    fs.existsSync(path.join(projectPath, 'pyproject.toml')) ||
    fs.existsSync(path.join(projectPath, 'setup.py'))
  )
}

/**
 * Parse requirements.txt for Python dependencies
 * Fixed to support dotted package names (zope.interface, google.cloud-storage, etc.)
 */
function parsePipRequirements(requirementsPath) {
  const content = fs.readFileSync(requirementsPath, 'utf8')
  const dependencies = {}

  content.split('\n').forEach(line => {
    // Remove inline comments (everything after #)
    const commentIndex = line.indexOf('#')
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex)
    }
    line = line.trim()

    // Skip empty lines
    if (!line) return

    // Parse: package==1.2.3 or package>=1.2.3
    // Support dotted names (zope.interface), hyphens (pytest-cov), underscores (google_cloud)
    // Also handle extras like fastapi[all] by capturing everything before the bracket
    // eslint-disable-next-line security/detect-unsafe-regex
    const match = line.match(/^([\w.-]+)(\[[\w,\s-]+\])?([><=!~]+)?(.*)$/)
    if (match) {
      const [, name, extras, operator, version] = match
      // Store package name without extras
      // eslint-disable-next-line security/detect-object-injection
      dependencies[name] =
        operator && version ? `${operator}${version.trim()}` : '*'
    }
  })

  return dependencies
}

/**
 * Parse pyproject.toml for Python dependencies (PEP 621 + legacy formats)
 * Supports:
 * - PEP 621: dependencies = ["package>=1.0.0", ...]
 * - PEP 621: [project.optional-dependencies] dev = ["package>=1.0.0"]
 * - Legacy: package = "^1.2.3" (Poetry, setuptools)
 */
function parsePyprojectToml(pyprojectPath) {
  const content = fs.readFileSync(pyprojectPath, 'utf8')
  const dependencies = {}

  // Parse PEP 621 list-style dependencies: dependencies = ["package>=1.0.0", ...]
  // Match main dependencies array: dependencies = [...]
  // Allow optional whitespace/comments after ] to handle: ]  # end of deps
  // eslint-disable-next-line security/detect-unsafe-regex
  const mainDepPattern = /^dependencies\s*=\s*\[([\s\S]*?)\]\s*(?:#.*)?$/m
  const mainMatch = mainDepPattern.exec(content)

  if (mainMatch) {
    const depList = mainMatch[1]
    // Extract individual package lines: "package>=1.0.0"
    const packagePattern = /["']([^"'\n]+)["']/g
    let pkgMatch

    while ((pkgMatch = packagePattern.exec(depList)) !== null) {
      const depString = pkgMatch[1].trim()

      // Parse: package>=1.0.0 or package[extra]>=1.0.0
      // Support dotted names, hyphens, underscores, and extras
       
      const match = depString.match(
        /^([\w.-]+)(\[[\w,\s-]+\])?([><=!~]+)?(.*)$/
      )
      if (match) {
        const [, name, extras, operator, version] = match
        // eslint-disable-next-line security/detect-object-injection
        dependencies[name] =
          operator && version ? `${operator}${version.trim()}` : '*'
      }
    }
  }

  // Parse optional-dependencies sections: [project.optional-dependencies] dev = [...]
  const optionalDepPattern =
    /\[project\.optional-dependencies\]([\s\S]*?)(?=\n\[|$)/
  const optionalMatch = optionalDepPattern.exec(content)

  if (optionalMatch) {
    const optionalSection = optionalMatch[1]
    // Match each optional group: dev = [...], test-suite = [...], lint-tools = [...]
    // Support hyphens, underscores, and dots in group names per PEP 621
    const groupPattern = /([\w.-]+)\s*=\s*\[([\s\S]*?)\]/g
    let groupMatch

    while ((groupMatch = groupPattern.exec(optionalSection)) !== null) {
      const depList = groupMatch[2]
      const packagePattern = /["']([^"'\n]+)["']/g
      let pkgMatch

      while ((pkgMatch = packagePattern.exec(depList)) !== null) {
        const depString = pkgMatch[1].trim()

         
        const match = depString.match(
          /^([\w.-]+)(\[[\w,\s-]+\])?([><=!~]+)?(.*)$/
        )
        if (match) {
          const [, name, extras, operator, version] = match
          // eslint-disable-next-line security/detect-object-injection
          dependencies[name] =
            operator && version ? `${operator}${version.trim()}` : '*'
        }
      }
    }
  }

  // Parse legacy key-value style: package = "^1.2.3"
  // This handles Poetry and old setuptools formats
  // ONLY parse within [tool.poetry.dependencies] and [project.dependencies] sections
  const poetryDepSection = /\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\n\[|$)/
  const projectDepSection = /\[project\.dependencies\]([\s\S]*?)(?=\n\[|$)/

  const sections = [poetryDepSection, projectDepSection]

  for (const sectionPattern of sections) {
    const sectionMatch = sectionPattern.exec(content)
    if (sectionMatch) {
      const sectionContent = sectionMatch[1]
      const kvPattern = /([\w.-]+)\s*=\s*["']([^"']+)["']/g
      let kvMatch

      while ((kvMatch = kvPattern.exec(sectionContent)) !== null) {
        const [, name, version] = kvMatch
        // Skip Python version specifier
        if (name === 'python') {
          continue
        }
        // Only add if not already found in list-style dependencies
        // eslint-disable-next-line security/detect-object-injection
        if (!dependencies[name]) {
          // eslint-disable-next-line security/detect-object-injection
          dependencies[name] = version
        }
      }
    }
  }

  return dependencies
}

/**
 * Detect Python frameworks similar to npm framework detection
 */
function detectPythonFrameworks(projectPath) {
  let dependencies = {}

  // Try requirements.txt first
  const reqPath = path.join(projectPath, 'requirements.txt')
  if (fs.existsSync(reqPath)) {
    dependencies = { ...dependencies, ...parsePipRequirements(reqPath) }
  }

  // Try pyproject.toml
  const pyprojectPath = path.join(projectPath, 'pyproject.toml')
  if (fs.existsSync(pyprojectPath)) {
    dependencies = { ...dependencies, ...parsePyprojectToml(pyprojectPath) }
  }

  const detectionResults = {
    primary: null,
    detected: {},
  }

  // Use same detection logic as npm frameworks
  for (const [frameworkName, categories] of Object.entries(
    PYTHON_FRAMEWORK_SIGNATURES
  )) {
    const matchedPackages = []

    for (const categoryPackages of Object.values(categories)) {
      for (const pattern of categoryPackages) {
        for (const [depName] of Object.entries(dependencies)) {
          if (matchesPattern(depName, pattern)) {
            matchedPackages.push(depName)
          }
        }
      }
    }

    if (matchedPackages.length > 0) {
      // eslint-disable-next-line security/detect-object-injection
      detectionResults.detected[frameworkName] = {
        present: true,
        packages: matchedPackages,
        count: matchedPackages.length,
      }

      // Set primary framework
      if (
        !detectionResults.primary &&
        ['django', 'flask', 'fastapi'].includes(frameworkName)
      ) {
        detectionResults.primary = frameworkName
      }
    }
  }

  return detectionResults
}

/**
 * Generate Django dependency groups
 */
/* eslint-disable no-unused-vars */
function generateDjangoGroups(_frameworkInfo) {
  return {
    'django-core': {
      patterns: ['django', 'djangorestframework'],
      'update-types': ['minor', 'patch'],
    },
    'django-extensions': {
      patterns: ['django-*'],
      'update-types': ['patch'],
    },
  }
}

/**
 * Generate FastAPI dependency groups
 */
/* eslint-disable no-unused-vars */
function generateFastAPIGroups(_frameworkInfo) {
  return {
    'fastapi-core': {
      patterns: ['fastapi', 'uvicorn', 'starlette', 'pydantic'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * Generate Flask dependency groups
 */
/* eslint-disable no-unused-vars */
function generateFlaskGroups(_frameworkInfo) {
  return {
    'flask-core': {
      patterns: ['flask', 'flask-*'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * Generate Data Science dependency groups
 */
/* eslint-disable no-unused-vars */
function generateDataScienceGroups(_frameworkInfo) {
  return {
    'data-core': {
      patterns: ['numpy', 'pandas', 'scipy'],
      'update-types': ['minor', 'patch'],
    },
    'ml-frameworks': {
      patterns: ['scikit-learn', 'tensorflow', 'torch', 'pytorch'],
      'update-types': ['patch'],
    },
    visualization: {
      patterns: ['matplotlib', 'seaborn', 'plotly'],
      'update-types': ['patch'],
    },
  }
}

/**
 * Generate Python testing groups
 */
/* eslint-disable no-unused-vars */
function generatePythonTestingGroups(_frameworkInfo) {
  return {
    'testing-frameworks': {
      patterns: ['pytest', 'pytest-*', 'coverage'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * ============================================================================
 * RUST/CARGO ECOSYSTEM SUPPORT
 * ============================================================================
 */

/**
 * Check if project has Rust dependencies
 */
function hasRustProject(projectPath) {
  return fs.existsSync(path.join(projectPath, 'Cargo.toml'))
}

/**
 * Parse Cargo.toml for Rust dependencies (simple regex-based)
 */
function parseCargoToml(cargoPath) {
  const content = fs.readFileSync(cargoPath, 'utf8')
  const dependencies = {}

  // Find [dependencies] section - extract until next section or end of file
  const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(?:\n\s*\[|$)/)
  if (!depsMatch) return dependencies

  const depsSection = depsMatch[1]

  // Handle multi-line inline tables by joining continuation lines
  let processedContent = depsSection
  // Join lines that are part of inline tables (lines ending with incomplete braces)
  processedContent = processedContent.replace(/\{[^}]*$/gm, match => {
    // Find the closing brace
    const startIdx = depsSection.indexOf(match)
    const restContent = depsSection.slice(startIdx)
    const closeBraceIdx = restContent.indexOf('}')
    if (closeBraceIdx !== -1) {
      return restContent.slice(0, closeBraceIdx + 1).replace(/\n/g, ' ')
    }
    return match
  })

  // Split by lines and process each line
  const lines = processedContent.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Match simple pattern: name = "version"
    // eslint-disable-next-line security/detect-unsafe-regex
    const simpleMatch = trimmed.match(/^(\w+(?:-\w+)*)\s*=\s*["']([^"']+)["']/)
    if (simpleMatch) {
      const [, name, version] = simpleMatch
      // eslint-disable-next-line security/detect-object-injection
      dependencies[name] = version
      continue
    }

    // Match complex pattern: name = { version = "...", ... }
    const complexMatch = trimmed.match(
      // eslint-disable-next-line security/detect-unsafe-regex
      /^(\w+(?:-\w+)*)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/
    )
    if (complexMatch) {
      const [, name, version] = complexMatch
      // eslint-disable-next-line security/detect-object-injection
      dependencies[name] = version
    }
  }

  return dependencies
}

/**
 * Detect Rust frameworks
 */
function detectRustFrameworks(projectPath) {
  const cargoPath = path.join(projectPath, 'Cargo.toml')
  if (!fs.existsSync(cargoPath)) {
    return { primary: null, detected: {} }
  }

  const dependencies = parseCargoToml(cargoPath)
  const detectionResults = {
    primary: null,
    detected: {},
  }

  for (const [frameworkName, categories] of Object.entries(
    RUST_FRAMEWORK_SIGNATURES
  )) {
    const matchedPackages = []

    for (const categoryPackages of Object.values(categories)) {
      for (const pattern of categoryPackages) {
        for (const [depName] of Object.entries(dependencies)) {
          if (matchesPattern(depName, pattern)) {
            matchedPackages.push(depName)
          }
        }
      }
    }

    if (matchedPackages.length > 0) {
      // eslint-disable-next-line security/detect-object-injection
      detectionResults.detected[frameworkName] = {
        present: true,
        packages: matchedPackages,
        count: matchedPackages.length,
      }

      if (
        !detectionResults.primary &&
        ['actix', 'rocket'].includes(frameworkName)
      ) {
        detectionResults.primary = frameworkName
      }
    }
  }

  return detectionResults
}

/**
 * Generate Actix dependency groups
 */
/* eslint-disable no-unused-vars */
function generateActixGroups(_frameworkInfo) {
  return {
    'actix-core': {
      patterns: ['actix-web', 'actix-rt'],
      'update-types': ['minor', 'patch'],
    },
    'actix-ecosystem': {
      patterns: ['actix-*'],
      'update-types': ['patch'],
    },
  }
}

/**
 * Generate Async runtime dependency groups
 */
/* eslint-disable no-unused-vars */
function generateAsyncRuntimeGroups(_frameworkInfo) {
  return {
    'async-runtime': {
      patterns: ['tokio', 'async-std', 'futures'],
      'update-types': ['patch'],
    },
  }
}

/**
 * Generate Serde dependency groups
 */
/* eslint-disable no-unused-vars */
function generateSerdeGroups(_frameworkInfo) {
  return {
    'serde-ecosystem': {
      patterns: ['serde', 'serde_json', 'serde_*'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * ============================================================================
 * RUBY/BUNDLER ECOSYSTEM SUPPORT
 * ============================================================================
 */

/**
 * Check if project has Ruby dependencies
 */
function hasRubyProject(projectPath) {
  return fs.existsSync(path.join(projectPath, 'Gemfile'))
}

/**
 * Parse Gemfile for Ruby dependencies
 */
function parseGemfile(gemfilePath) {
  const content = fs.readFileSync(gemfilePath, 'utf8')
  const dependencies = {}

  // Process line by line to avoid newline issues
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Match: gem 'rails', '~> 7.0' or gem 'rails'
    const gemMatch = trimmed.match(
      // eslint-disable-next-line security/detect-unsafe-regex
      /gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/
    )
    if (gemMatch) {
      const [, name, version] = gemMatch
      // eslint-disable-next-line security/detect-object-injection
      dependencies[name] = version || '*'
    }
  }

  return dependencies
}

/**
 * Detect Ruby frameworks
 */
function detectRubyFrameworks(projectPath) {
  const gemfilePath = path.join(projectPath, 'Gemfile')
  if (!fs.existsSync(gemfilePath)) {
    return { primary: null, detected: {} }
  }

  const dependencies = parseGemfile(gemfilePath)
  const detectionResults = {
    primary: null,
    detected: {},
  }

  for (const [frameworkName, categories] of Object.entries(
    RUBY_FRAMEWORK_SIGNATURES
  )) {
    const matchedPackages = []

    for (const categoryPackages of Object.values(categories)) {
      for (const pattern of categoryPackages) {
        for (const [depName] of Object.entries(dependencies)) {
          if (matchesPattern(depName, pattern)) {
            matchedPackages.push(depName)
          }
        }
      }
    }

    if (matchedPackages.length > 0) {
      // eslint-disable-next-line security/detect-object-injection
      detectionResults.detected[frameworkName] = {
        present: true,
        packages: matchedPackages,
        count: matchedPackages.length,
      }

      if (
        !detectionResults.primary &&
        ['rails', 'sinatra'].includes(frameworkName)
      ) {
        detectionResults.primary = frameworkName
      }
    }
  }

  return detectionResults
}

/**
 * Generate Rails dependency groups
 */
/* eslint-disable no-unused-vars */
function generateRailsGroups(_frameworkInfo) {
  return {
    'rails-core': {
      patterns: ['rails', 'activerecord', 'actionpack'],
      'update-types': ['minor', 'patch'],
    },
    'rails-ecosystem': {
      patterns: ['rails-*', 'active*'],
      'update-types': ['patch'],
    },
  }
}

/**
 * Generate RSpec dependency groups
 */
/* eslint-disable no-unused-vars */
function generateRSpecGroups(_frameworkInfo) {
  return {
    'testing-frameworks': {
      patterns: ['rspec', 'rspec-*', 'capybara', 'factory_bot'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * Detect all ecosystems present in project
 */
function detectAllEcosystems(projectPath) {
  const ecosystems = {}

  // npm detection (existing)
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')

      // Validate JSON content before parsing
      if (!packageJsonContent || packageJsonContent.trim().length === 0) {
        console.error('❌ package.json is empty')
        console.log(
          'Please add valid JSON content to package.json and try again.'
        )
        process.exit(1)
      }

      const packageJson = JSON.parse(packageJsonContent)

      // Validate package.json structure
      if (typeof packageJson !== 'object' || packageJson === null) {
        console.error('❌ package.json must contain a valid JSON object')
        console.log('Please fix the package.json structure and try again.')
        process.exit(1)
      }

      ecosystems.npm = detectFrameworks(packageJson)
    } catch (error) {
      console.error(`❌ Error parsing package.json: ${error.message}`)
      console.log('\nPlease fix the JSON syntax in package.json and try again.')
      console.log(
        'Common issues: trailing commas, missing quotes, unclosed brackets\n'
      )
      process.exit(1)
    }
  }

  // Python detection
  if (hasPythonProject(projectPath)) {
    ecosystems.pip = detectPythonFrameworks(projectPath)
  }

  // Rust detection
  if (hasRustProject(projectPath)) {
    ecosystems.cargo = detectRustFrameworks(projectPath)
  }

  // Ruby detection
  if (hasRubyProject(projectPath)) {
    ecosystems.bundler = detectRubyFrameworks(projectPath)
  }

  return ecosystems
}

/**
 * Generate dependency groups for npm ecosystem
 */
function generateNpmGroups(npmFrameworks) {
  let allGroups = {}

  if (npmFrameworks.detected.react) {
    allGroups = {
      ...allGroups,
      ...generateReactGroups(npmFrameworks.detected.react),
    }
  }

  if (npmFrameworks.detected.vue) {
    allGroups = {
      ...allGroups,
      ...generateVueGroups(npmFrameworks.detected.vue),
    }
  }

  if (npmFrameworks.detected.angular) {
    allGroups = {
      ...allGroups,
      ...generateAngularGroups(npmFrameworks.detected.angular),
    }
  }

  if (npmFrameworks.detected.testing) {
    allGroups = {
      ...allGroups,
      ...generateTestingGroups(npmFrameworks.detected.testing),
    }
  }

  if (npmFrameworks.detected.build) {
    allGroups = {
      ...allGroups,
      ...generateBuildToolGroups(npmFrameworks.detected.build),
    }
  }

  if (npmFrameworks.detected.storybook) {
    allGroups = {
      ...allGroups,
      ...generateStorybookGroups(npmFrameworks.detected.storybook),
    }
  }

  return allGroups
}

/**
 * Generate dependency groups for pip ecosystem
 */
function generatePipGroups(pipFrameworks) {
  let allGroups = {}

  if (pipFrameworks.detected.django) {
    allGroups = {
      ...allGroups,
      ...generateDjangoGroups(pipFrameworks.detected.django),
    }
  }

  if (pipFrameworks.detected.flask) {
    allGroups = {
      ...allGroups,
      ...generateFlaskGroups(pipFrameworks.detected.flask),
    }
  }

  if (pipFrameworks.detected.fastapi) {
    allGroups = {
      ...allGroups,
      ...generateFastAPIGroups(pipFrameworks.detected.fastapi),
    }
  }

  if (pipFrameworks.detected.datascience) {
    allGroups = {
      ...allGroups,
      ...generateDataScienceGroups(pipFrameworks.detected.datascience),
    }
  }

  if (pipFrameworks.detected.testing) {
    allGroups = {
      ...allGroups,
      ...generatePythonTestingGroups(pipFrameworks.detected.testing),
    }
  }

  return allGroups
}

/**
 * Generate dependency groups for cargo ecosystem
 */
function generateCargoGroups(cargoFrameworks) {
  let allGroups = {}

  if (cargoFrameworks.detected.actix) {
    allGroups = {
      ...allGroups,
      ...generateActixGroups(cargoFrameworks.detected.actix),
    }
  }

  if (cargoFrameworks.detected.async) {
    allGroups = {
      ...allGroups,
      ...generateAsyncRuntimeGroups(cargoFrameworks.detected.async),
    }
  }

  if (cargoFrameworks.detected.serde) {
    allGroups = {
      ...allGroups,
      ...generateSerdeGroups(cargoFrameworks.detected.serde),
    }
  }

  return allGroups
}

/**
 * Generate dependency groups for bundler ecosystem
 */
function generateBundlerGroups(bundlerFrameworks) {
  let allGroups = {}

  if (bundlerFrameworks.detected.rails) {
    allGroups = {
      ...allGroups,
      ...generateRailsGroups(bundlerFrameworks.detected.rails),
    }
  }

  if (bundlerFrameworks.detected.testing) {
    allGroups = {
      ...allGroups,
      ...generateRSpecGroups(bundlerFrameworks.detected.testing),
    }
  }

  return allGroups
}

/**
 * Generate premium Dependabot configuration with multi-language framework-aware grouping
 *
 * @param {Object} options - Configuration options
 * @param {string} options.projectPath - Path to project directory
 * @param {string} options.schedule - Update schedule (daily, weekly, monthly)
 * @param {string} options.day - Day of week for updates
 * @param {string} options.time - Time for updates
 * @returns {Object|null} Dependabot configuration object or null if not licensed
 */
function generatePremiumDependabotConfig(options = {}) {
  const license = getLicenseInfo()

  // v3.0.0 FREE BETA: All premium features unlocked
  // Premium features require Pro or Enterprise tier (after beta ends)
  // Commenting out tier check during free beta period
  /* eslint-disable-next-line no-constant-condition, no-constant-binary-expression */
  if (false && license.tier === 'free') {
    console.log(
      '💡 Multi-language monitoring requires Pro tier. Generating basic config...'
    )
    return generateBasicDependabotConfig(options)
  }

  const {
    projectPath = '.',
    schedule = 'weekly',
    day = 'monday',
    time = '09:00',
  } = options

  // Detect all ecosystems
  const ecosystems = detectAllEcosystems(projectPath)

  // If no ecosystems detected, return null
  if (Object.keys(ecosystems).length === 0) {
    return null
  }

  const updates = []

  // npm ecosystem (if present)
  if (ecosystems.npm) {
    const npmGroups = generateNpmGroups(ecosystems.npm)
    updates.push({
      'package-ecosystem': 'npm',
      directory: '/',
      schedule: { interval: schedule, day, time },
      'open-pull-requests-limit': 10,
      labels: ['dependencies', 'npm'],
      'commit-message': { prefix: 'deps(npm)', include: 'scope' },
      ...(Object.keys(npmGroups).length > 0 && { groups: npmGroups }),
    })
  }

  // pip ecosystem (if present)
  if (ecosystems.pip) {
    const pipGroups = generatePipGroups(ecosystems.pip)
    updates.push({
      'package-ecosystem': 'pip',
      directory: '/',
      schedule: { interval: schedule, day, time },
      'open-pull-requests-limit': 10,
      labels: ['dependencies', 'python'],
      'commit-message': { prefix: 'deps(python)' },
      ...(Object.keys(pipGroups).length > 0 && { groups: pipGroups }),
    })
  }

  // cargo ecosystem (if present)
  if (ecosystems.cargo) {
    const cargoGroups = generateCargoGroups(ecosystems.cargo)
    updates.push({
      'package-ecosystem': 'cargo',
      directory: '/',
      schedule: { interval: schedule, day, time },
      'open-pull-requests-limit': 10,
      labels: ['dependencies', 'rust'],
      'commit-message': { prefix: 'deps(rust)' },
      ...(Object.keys(cargoGroups).length > 0 && { groups: cargoGroups }),
    })
  }

  // bundler ecosystem (if present)
  if (ecosystems.bundler) {
    const bundlerGroups = generateBundlerGroups(ecosystems.bundler)
    updates.push({
      'package-ecosystem': 'bundler',
      directory: '/',
      schedule: { interval: schedule, day, time },
      'open-pull-requests-limit': 10,
      labels: ['dependencies', 'ruby'],
      'commit-message': { prefix: 'deps(ruby)' },
      ...(Object.keys(bundlerGroups).length > 0 && { groups: bundlerGroups }),
    })
  }

  // GitHub Actions monitoring (always included)
  updates.push({
    'package-ecosystem': 'github-actions',
    directory: '/',
    schedule: { interval: schedule, day, time },
    labels: ['dependencies', 'github-actions'],
    'commit-message': { prefix: 'deps(actions)' },
  })

  const config = {
    version: 2,
    updates,
  }

  return { config, ecosystems }
}

/**
 * Write premium Dependabot configuration to file (multi-language support)
 *
 * @param {Object} configData - Config and ecosystem detection results
 * @param {string} outputPath - Path to write config file
 */
function writePremiumDependabotConfig(configData, outputPath) {
  const { config, ecosystems } = configData

  // Build header with all detected ecosystems
  const detectedLanguages = Object.keys(ecosystems).filter(e => e !== 'npm')
  const languageList = Object.keys(ecosystems).join(', ')

  let frameworkSummary = ''
  Object.entries(ecosystems).forEach(([ecosystem, data]) => {
    const frameworks = Object.keys(data.detected || {}).join(', ')
    if (frameworks) {
      frameworkSummary += `# ${ecosystem}: ${frameworks}\n`
    }
  })

  const yamlContent = `# Premium Dependabot configuration (Pro Tier)
# Auto-generated by create-quality-automation
# Multi-language framework-aware dependency grouping
#
# Detected ecosystems: ${languageList}
${frameworkSummary}#
# This configuration groups dependencies by framework to reduce PR volume
# and make dependency updates more manageable across all languages.
#
# Learn more: https://create-quality-automation.dev/docs/multi-language-grouping

${convertToYaml(config)}`

  const configDir = path.dirname(outputPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, yamlContent)
}

/**
 * Simple YAML converter (basic implementation)
 * Extended from basic version to support groups field
 */
function convertToYaml(obj, indent = 0) {
  const spaces = ' '.repeat(indent)
  let yaml = ''

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}- ${convertToYaml(item, indent + 2).trim()}\n`
      } else {
        yaml += `${spaces}- ${item}\n`
      }
    })
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`
        yaml += convertToYaml(value, indent + 2)
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`
        yaml += convertToYaml(value, indent + 2)
      } else {
        yaml += `${spaces}${key}: ${value}\n`
      }
    })
  }

  return yaml
}

module.exports = {
  // npm ecosystem
  detectFrameworks,
  generateReactGroups,
  generateVueGroups,
  generateAngularGroups,
  generateTestingGroups,
  generateBuildToolGroups,
  generateStorybookGroups,

  // Python ecosystem
  detectPythonFrameworks,
  generateDjangoGroups,
  generateFlaskGroups,
  generateFastAPIGroups,
  generateDataScienceGroups,
  generatePythonTestingGroups,

  // Rust ecosystem
  detectRustFrameworks,
  generateActixGroups,
  generateAsyncRuntimeGroups,
  generateSerdeGroups,

  // Ruby ecosystem
  detectRubyFrameworks,
  generateRailsGroups,
  generateRSpecGroups,

  // Multi-language support
  detectAllEcosystems,
  generateNpmGroups,
  generatePipGroups,
  generateCargoGroups,
  generateBundlerGroups,

  // Main config generation
  generatePremiumDependabotConfig,
  writePremiumDependabotConfig,

  // Parsing functions (for testing)
  parsePyprojectToml,
  parsePipRequirements,
  parseCargoToml,
  parseGemfile,

  // Framework signatures (for testing)
  NPM_FRAMEWORK_SIGNATURES,
  PYTHON_FRAMEWORK_SIGNATURES,
  RUST_FRAMEWORK_SIGNATURES,
  RUBY_FRAMEWORK_SIGNATURES,
}
