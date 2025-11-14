# PREMIUM-002: Multi-Language Dependency Monitoring Implementation Plan

**Status**: In Progress
**Priority**: P0 (Critical - Block Premium Launch)
**Effort**: XL (12 hours estimated)
**Business Value**: Addresses roadmap promise, expands market beyond JavaScript-only projects

## Executive Summary

Extend premium dependency monitoring beyond npm to support Python (Pip), Rust (Cargo), and Ruby (Bundler) ecosystems with intelligent framework-aware grouping similar to PREMIUM-001's JavaScript implementation.

## Objectives

1. **Python/Pip Support**: Django, Flask, FastAPI, pytest, data science ecosystems
2. **Rust/Cargo Support**: actix-web, tokio, serde, common Rust frameworks
3. **Ruby/Bundler Support**: Rails, Sinatra, RSpec, common Ruby gems
4. **Multi-Language Projects**: Handle polyglot repositories with multiple package managers
5. **Consistent UX**: Same tier gating, configuration output, and user experience as npm

## Architecture Analysis

### Existing Foundation (PREMIUM-001)

**Strong Points to Reuse:**

- Framework detection pattern (signature-based matching)
- Group generation functions (by ecosystem)
- License tier validation (Pro/Enterprise only)
- YAML generation and file writing
- Wildcard pattern matching (`@tanstack/*` style)

**Structure:**

```javascript
// Existing npm-focused architecture
FRAMEWORK_SIGNATURES → detectFrameworks() → generateGroups() → generateConfig()
```

### Multi-Language Extension Strategy

**Extend vs Rewrite Decision**: **EXTEND** existing architecture

**Rationale:**

- Core pattern (signatures → detection → grouping → config) proven successful
- Can reuse license validation, YAML generation, file operations
- Consistent user experience across all languages
- Easier maintenance and testing

**New Architecture:**

```javascript
// Multi-language architecture (backward compatible)
ECOSYSTEM_SIGNATURES {
  npm: { frameworks: FRAMEWORK_SIGNATURES },  // Existing
  pip: { frameworks: PYTHON_FRAMEWORKS },     // New
  cargo: { frameworks: RUST_FRAMEWORKS },     // New
  bundler: { frameworks: RUBY_FRAMEWORKS }    // New
}

detectEcosystems(projectPath) → {
  npm: detectFrameworks(packageJson),
  pip: detectPythonFrameworks(requirements),
  cargo: detectRustFrameworks(cargoToml),
  bundler: detectRubyFrameworks(gemfile)
}

generateMultiLanguageConfig() → {
  version: 2,
  updates: [
    npmConfig,      // With framework groups
    pipConfig,      // With framework groups
    cargoConfig,    // With framework groups
    bundlerConfig,  // With framework groups
    githubActionsConfig
  ]
}
```

## Phase 1: Python/Pip Ecosystem Detection (3 hours)

### File Detection

```javascript
/**
 * Detect Python project files
 */
function hasPythonProject(projectPath) {
  return (
    fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
    fs.existsSync(path.join(projectPath, 'Pipfile')) ||
    fs.existsSync(path.join(projectPath, 'pyproject.toml')) ||
    fs.existsSync(path.join(projectPath, 'setup.py'))
  )
}
```

### Python Framework Signatures

```javascript
const PYTHON_FRAMEWORKS = {
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
```

### Dependency File Parsing

```javascript
/**
 * Parse requirements.txt for Python dependencies
 */
function parsePipRequirements(requirementsPath) {
  const content = fs.readFileSync(requirementsPath, 'utf8')
  const dependencies = {}

  content.split('\n').forEach(line => {
    line = line.trim()
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return

    // Parse: package==1.2.3 or package>=1.2.3
    const match = line.match(/^([a-zA-Z0-9_-]+)([><=!]+)?(.*)$/)
    if (match) {
      const [, name, operator, version] = match
      dependencies[name] = operator && version ? `${operator}${version}` : '*'
    }
  })

  return dependencies
}

/**
 * Parse pyproject.toml for Python dependencies
 */
function parsePyprojectToml(pyprojectPath) {
  // Use simple regex parsing (avoid external TOML parser dependency)
  const content = fs.readFileSync(pyprojectPath, 'utf8')
  const dependencies = {}

  // Match: package = "^1.2.3" or package = { version = "^1.2.3" }
  const depPattern = /(\w+)\s*=\s*["']([^"']+)["']/g
  let match

  while ((match = depPattern.exec(content)) !== null) {
    const [, name, version] = match
    dependencies[name] = version
  }

  return dependencies
}
```

### Python Framework Detection

```javascript
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
  for (const [frameworkName, categories] of Object.entries(PYTHON_FRAMEWORKS)) {
    const matchedPackages = []

    for (const categoryPackages of Object.values(categories)) {
      for (const pattern of categoryPackages) {
        for (const [depName, depVersion] of Object.entries(dependencies)) {
          if (matchesPattern(depName, pattern)) {
            matchedPackages.push(depName)
          }
        }
      }
    }

    if (matchedPackages.length > 0) {
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
```

### Python Dependency Groups

```javascript
/**
 * Generate Django dependency groups
 */
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
function generateFastAPIGroups(_frameworkInfo) {
  return {
    'fastapi-core': {
      patterns: ['fastapi', 'uvicorn', 'starlette', 'pydantic'],
      'update-types': ['minor', 'patch'],
    },
  }
}

/**
 * Generate data science dependency groups
 */
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
function generatePythonTestingGroups(_frameworkInfo) {
  return {
    'testing-frameworks': {
      patterns: ['pytest', 'pytest-*', 'coverage'],
      'update-types': ['minor', 'patch'],
    },
  }
}
```

## Phase 2: Rust/Cargo Ecosystem Detection (3 hours)

### Cargo.toml Parsing

```javascript
/**
 * Parse Cargo.toml for Rust dependencies
 */
function parseCargoToml(cargoPath) {
  const content = fs.readFileSync(cargoPath, 'utf8')
  const dependencies = {}

  // Simple regex-based TOML parsing for [dependencies] section
  const depsSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/)?.[1]
  if (depsSection) {
    const depPattern = /(\w+)\s*=\s*["']([^"']+)["']/g
    let match

    while ((match = depPattern.exec(depsSection)) !== null) {
      const [, name, version] = match
      dependencies[name] = version
    }
  }

  return dependencies
}
```

### Rust Framework Signatures

```javascript
const RUST_FRAMEWORKS = {
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
```

### Rust Dependency Groups

```javascript
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

function generateAsyncGroups(_frameworkInfo) {
  return {
    'async-runtime': {
      patterns: ['tokio', 'async-std', 'futures'],
      'update-types': ['patch'],
    },
  }
}

function generateSerdeGroups(_frameworkInfo) {
  return {
    'serde-ecosystem': {
      patterns: ['serde', 'serde_json', 'serde_*'],
      'update-types': ['minor', 'patch'],
    },
  }
}
```

## Phase 3: Ruby/Bundler Ecosystem Detection (3 hours)

### Gemfile Parsing

```javascript
/**
 * Parse Gemfile for Ruby dependencies
 */
function parseGemfile(gemfilePath) {
  const content = fs.readFileSync(gemfilePath, 'utf8')
  const dependencies = {}

  // Match: gem 'rails', '~> 7.0'
  const gemPattern = /gem\s+['"]([^'"]+)['"]\s*,?\s*['"]?([^'"]*)?['"]?/g
  let match

  while ((match = gemPattern.exec(content)) !== null) {
    const [, name, version] = match
    dependencies[name] = version || '*'
  }

  return dependencies
}
```

### Ruby Framework Signatures

```javascript
const RUBY_FRAMEWORKS = {
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
    frameworks: ['rspec', 'minitest'],
    helpers: ['capybara', 'factory_bot'],
  },
  utilities: {
    async: ['sidekiq', 'delayed_job'],
    http: ['faraday', 'httparty'],
  },
}
```

### Ruby Dependency Groups

```javascript
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

function generateRSpecGroups(_frameworkInfo) {
  return {
    'testing-frameworks': {
      patterns: ['rspec', 'rspec-*', 'capybara', 'factory_bot'],
      'update-types': ['minor', 'patch'],
    },
  }
}
```

## Phase 4: Multi-Language Config Integration (2 hours)

### Enhanced Premium Config Generator

```javascript
/**
 * Generate premium Dependabot config with multi-language support
 */
function generatePremiumDependabotConfig(options = {}) {
  const license = getLicenseInfo()

  // Premium features require Pro or Enterprise tier
  if (license.tier === 'free') {
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

  const ecosystems = detectAllEcosystems(projectPath)
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

  // GitHub Actions (always included)
  updates.push({
    'package-ecosystem': 'github-actions',
    directory: '/',
    schedule: { interval: schedule, day, time },
    labels: ['dependencies', 'github-actions'],
    'commit-message': { prefix: 'deps(actions)' },
  })

  return {
    config: { version: 2, updates },
    ecosystems,
  }
}

/**
 * Detect all ecosystems present in project
 */
function detectAllEcosystems(projectPath) {
  const ecosystems = {}

  // npm detection (existing)
  if (hasNpmProject(projectPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
    )
    ecosystems.npm = detectFrameworks(packageJson)
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
```

### Updated Config Writer

```javascript
/**
 * Write multi-language premium config with detected ecosystems
 */
function writePremiumDependabotConfig(configData, outputPath) {
  const { config, ecosystems } = configData

  // Build header with all detected ecosystems
  const detectedLanguages = Object.keys(ecosystems).filter(e => e !== 'npm')
  const languageList = ['npm', ...detectedLanguages].join(', ')

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
```

## Phase 5: Comprehensive Testing (1 hour)

### Test Structure

```javascript
// tests/multi-language-dependency-monitoring.test.js

// Python Tests (5 scenarios)
- testPythonDjangoDetection()
- testPythonFastAPIDetection()
- testPythonDataScienceDetection()
- testPipRequirementsParsing()
- testPyprojectTomlParsing()

// Rust Tests (3 scenarios)
- testRustActixDetection()
- testRustAsyncDetection()
- testCargoTomlParsing()

// Ruby Tests (3 scenarios)
- testRubyRailsDetection()
- testRubyTestingDetection()
- testGemfileParsing()

// Multi-Language Tests (4 scenarios)
- testPolyglotProject() // npm + pip + cargo + bundler
- testPythonJavaScriptMix() // npm + pip
- testMultiLanguageGrouping()
- testEcosystemPrioritization()

Total: 15 comprehensive tests
```

### Test Fixtures

```javascript
const djangoRequirements = `
django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
gunicorn==20.1.0
pytest==7.3.0
`

const fastApiPyproject = `
[tool.poetry.dependencies]
fastapi = "^0.95.0"
uvicorn = "^0.21.0"
pydantic = "^1.10.0"
`

const railsGemfile = `
gem 'rails', '~> 7.0'
gem 'pg', '~> 1.5'
gem 'rspec-rails'
gem 'factory_bot_rails'
`

const actixCargoToml = `
[dependencies]
actix-web = "4.3"
tokio = "1.28"
serde = { version = "1.0", features = ["derive"] }
`
```

## Phase 6: Documentation & Examples (30 minutes)

### README Updates

````markdown
### Multi-Language Dependency Monitoring (v3.1.0+)

**Pro Tier Feature**: Automatic framework-aware grouping for Python, Rust, and Ruby projects.

**Supported Languages:**

- **npm** (JavaScript/TypeScript): React, Vue, Angular, Svelte, Testing, Build tools
- **pip** (Python): Django, Flask, FastAPI, Data Science, Testing frameworks
- **cargo** (Rust): Actix, Tokio, Serde, Testing frameworks
- **bundler** (Ruby): Rails, Sinatra, RSpec, Testing frameworks

**Polyglot Project Example:**

```yaml
# Detected ecosystems: npm, pip, cargo, bundler
# npm: react, testing, build
# pip: django, testing
# cargo: actix, async
# bundler: rails

groups:
  # JavaScript groups
  react-core:
    patterns: [react, react-dom]
  testing-frameworks:
    patterns: [jest, pytest, rspec, criterion]

  # Python groups
  django-core:
    patterns: [django, djangorestframework]

  # Rust groups
  actix-core:
    patterns: [actix-web, actix-rt]

  # Ruby groups
  rails-core:
    patterns: [rails, activerecord]
```
````

````

### CHANGELOG Entry
```markdown
## [3.1.0] - 2025-11-14

### Added - PREMIUM-002
- **Multi-language dependency monitoring** (Pro tier)
  - Python/Pip framework detection (Django, Flask, FastAPI, Data Science)
  - Rust/Cargo framework detection (Actix, Tokio, Serde)
  - Ruby/Bundler framework detection (Rails, Sinatra, RSpec)
  - Polyglot project support (multiple package managers in one repo)
  - 15 comprehensive tests for all language ecosystems
  - Consistent grouping UX across all languages

### Technical Details
- `lib/dependency-monitoring-premium.js`: Multi-language ecosystem detection
- `tests/multi-language-dependency-monitoring.test.js`: 15 test scenarios
- Requirements.txt, Cargo.toml, Gemfile parsing
- Framework-aware grouping for Python, Rust, Ruby ecosystems
````

## Success Criteria

### Functional Requirements

- ✅ Python projects detected and grouped correctly (Django, Flask, FastAPI)
- ✅ Rust projects detected and grouped correctly (Actix, Tokio, Serde)
- ✅ Ruby projects detected and grouped correctly (Rails, Sinatra, RSpec)
- ✅ Polyglot projects support multiple ecosystems simultaneously
- ✅ License tier gating works (Pro/Enterprise only)
- ✅ Free tier falls back to basic config gracefully

### Quality Requirements

- ✅ All 15 tests passing
- ✅ ESLint clean (0 errors)
- ✅ Test coverage ≥75% for new code
- ✅ Documentation complete (README, CHANGELOG)
- ✅ Example configs generated correctly

### Business Requirements

- ✅ Addresses backlog P0 item PREMIUM-002
- ✅ Delivers roadmap promise (README.md:125 mentions "Coming this month")
- ✅ Expands market beyond JavaScript-only projects
- ✅ Justifies Pro tier pricing ($39/mo)
- ✅ Ready for free beta (no payment required)

## Risk Assessment

### Technical Risks

- **TOML/Gemfile parsing complexity**: MEDIUM - Simple regex parsing may miss edge cases
  - _Mitigation_: Use conservative regex, validate with test fixtures, document limitations
- **Dependency file variations**: LOW - Multiple file formats per language (requirements.txt vs pyproject.toml)
  - _Mitigation_: Support most common formats, clear error messages for unsupported formats

### Business Risks

- **Feature complexity**: LOW - Following proven PREMIUM-001 architecture
- **Testing completeness**: LOW - Comprehensive test plan with 15 scenarios

## Timeline

- **Phase 1 (Python)**: 3 hours
- **Phase 2 (Rust)**: 3 hours
- **Phase 3 (Ruby)**: 3 hours
- **Phase 4 (Integration)**: 2 hours
- **Phase 5 (Testing)**: 1 hour
- **Phase 6 (Documentation)**: 30 minutes

**Total**: ~12 hours (realistic estimate with testing and documentation)

## Implementation Notes

- Reuse existing `matchesPattern()` function for wildcard support
- Reuse existing `convertToYaml()` function for config generation
- Reuse existing `getLicenseInfo()` for tier validation
- Follow same test structure as `premium-dependency-monitoring.test.js`
- Use same commit message format as PREMIUM-001

## Next Steps After PREMIUM-002

1. **TELEMETRY-001**: Remote telemetry endpoint for product intelligence
2. **PREMIUM-003**: Advanced security workflows
3. **PREMIUM-004**: Enterprise notifications (Slack/Teams)

---

**Implementation Start**: 2025-11-14
**Target Completion**: 2025-11-14
**Assigned To**: /sc:task orchestration
