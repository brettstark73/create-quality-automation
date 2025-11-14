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
 * Framework signature patterns for detection
 * Maps framework names to dependency patterns that indicate their presence
 */
const FRAMEWORK_SIGNATURES = {
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
    FRAMEWORK_SIGNATURES
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
 * Generate premium Dependabot configuration with framework-aware grouping
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

  // Premium features require Pro or Enterprise tier
  if (license.tier === 'free') {
    console.log(
      '💡 Framework-aware grouping requires Pro tier. Generating basic config...'
    )
    return generateBasicDependabotConfig(options)
  }

  const {
    projectPath = '.',
    schedule = 'weekly',
    day = 'monday',
    time = '09:00',
  } = options

  // Load package.json to detect frameworks
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    return null
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const frameworks = detectFrameworks(packageJson)

  // Generate groups based on detected frameworks
  let allGroups = {}

  if (frameworks.detected.react) {
    allGroups = {
      ...allGroups,
      ...generateReactGroups(frameworks.detected.react),
    }
  }

  if (frameworks.detected.vue) {
    allGroups = { ...allGroups, ...generateVueGroups(frameworks.detected.vue) }
  }

  if (frameworks.detected.angular) {
    allGroups = {
      ...allGroups,
      ...generateAngularGroups(frameworks.detected.angular),
    }
  }

  if (frameworks.detected.testing) {
    allGroups = {
      ...allGroups,
      ...generateTestingGroups(frameworks.detected.testing),
    }
  }

  if (frameworks.detected.build) {
    allGroups = {
      ...allGroups,
      ...generateBuildToolGroups(frameworks.detected.build),
    }
  }

  if (frameworks.detected.storybook) {
    allGroups = {
      ...allGroups,
      ...generateStorybookGroups(frameworks.detected.storybook),
    }
  }

  // Build Dependabot config with groups
  const config = {
    version: 2,
    updates: [
      {
        'package-ecosystem': 'npm',
        directory: '/',
        schedule: {
          interval: schedule,
          day: day,
          time: time,
        },
        'open-pull-requests-limit': 10, // Higher limit for grouped updates
        labels: ['dependencies'],
        'commit-message': {
          prefix: 'deps',
          include: 'scope',
        },
        ...(Object.keys(allGroups).length > 0 && { groups: allGroups }),
      },
      // GitHub Actions monitoring
      {
        'package-ecosystem': 'github-actions',
        directory: '/',
        schedule: {
          interval: schedule,
          day: day,
          time: time,
        },
        labels: ['dependencies', 'github-actions'],
        'commit-message': {
          prefix: 'deps(actions)',
        },
      },
    ],
  }

  return { config, frameworks }
}

/**
 * Write premium Dependabot configuration to file
 *
 * @param {Object} configData - Config and framework detection results
 * @param {string} outputPath - Path to write config file
 */
function writePremiumDependabotConfig(configData, outputPath) {
  const { config, frameworks } = configData

  // Build header with detected frameworks
  const detectedFrameworks = Object.keys(frameworks.detected).join(', ')
  const primaryFramework = frameworks.primary || 'none detected'

  const yamlContent = `# Premium Dependabot configuration (Pro Tier)
# Auto-generated by create-quality-automation
# Framework-aware dependency grouping enabled
#
# Detected frameworks: ${detectedFrameworks}
# Primary framework: ${primaryFramework}
#
# This configuration groups dependencies by framework to reduce PR volume
# and make dependency updates more manageable.
#
# Learn more: https://create-quality-automation.dev/docs/dependency-grouping

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
  detectFrameworks,
  generateReactGroups,
  generateVueGroups,
  generateAngularGroups,
  generateTestingGroups,
  generateBuildToolGroups,
  generateStorybookGroups,
  generatePremiumDependabotConfig,
  writePremiumDependabotConfig,
  FRAMEWORK_SIGNATURES,
}
