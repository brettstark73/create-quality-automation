'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

/**
 * Edge case tests for monorepos and workspaces
 * Ensures quality automation setup works correctly in complex project structures
 */
async function testMonorepoEdgeCases() {
  console.log('🧪 Testing monorepo and workspace edge cases...\n')

  await testNpmWorkspaces()
  await testPnpmWorkspaces()
  await testYarnWorkspaces()
  await testLernaMonorepo()
  await testNestedPackageJson()
  await testWorkspacePackageSetup()
  await testMixedLanguageMonorepo()

  console.log('\n✅ All monorepo edge case tests passed!\n')
}

/**
 * Test npm workspaces configuration
 */
async function testNpmWorkspaces() {
  console.log('🔍 Testing npm workspaces...')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-workspace-test-'))
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    // Initialize git
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create workspace root package.json
    const rootPackageJson = {
      name: 'monorepo-root',
      version: '1.0.0',
      private: true,
      workspaces: ['packages/*'],
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create workspace package
    const packagesDir = path.join(testDir, 'packages', 'app')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(packagesDir, { recursive: true })

    const workspacePackageJson = {
      name: '@monorepo/app',
      version: '1.0.0',
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(packagesDir, 'package.json'),
      JSON.stringify(workspacePackageJson, null, 2)
    )

    // Create index file to make it a valid package
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(packagesDir, 'index.js'), 'module.exports = {}')

    // Run setup in workspace root
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify configs were created at root level (not in workspace packages)
    const expectedRootFiles = [
      '.prettierrc',
      'eslint.config.cjs',
      '.editorconfig',
    ]

    for (const file of expectedRootFiles) {
      const filePath = path.join(testDir, file)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(filePath)) {
        throw new Error(`Expected root config file not created: ${file}`)
      }
    }

    // Verify workspace package does NOT have duplicate configs
    const workspaceConfigPath = path.join(packagesDir, '.prettierrc')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(workspaceConfigPath)) {
      throw new Error(
        'Workspace package should not have duplicate config files'
      )
    }

    console.log('  ✅ npm workspaces configuration works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test pnpm workspaces configuration
 */
async function testPnpmWorkspaces() {
  console.log('🔍 Testing pnpm workspaces...')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pnpm-workspace-test-'))
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create pnpm-workspace.yaml
    const pnpmWorkspaceConfig = `packages:
  - 'packages/*'
`
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'pnpm-workspace.yaml'),
      pnpmWorkspaceConfig
    )

    // Create root package.json
    const rootPackageJson = {
      name: 'pnpm-monorepo',
      version: '1.0.0',
      private: true,
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create workspace package
    const packagesDir = path.join(testDir, 'packages', 'lib')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(packagesDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(packagesDir, 'package.json'),
      JSON.stringify({ name: '@monorepo/lib', version: '1.0.0' }, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(packagesDir, 'index.js'), 'module.exports = {}')

    // Run setup
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify pnpm-workspace.yaml still exists and wasn't modified
    const workspaceYamlPath = path.join(testDir, 'pnpm-workspace.yaml')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(workspaceYamlPath)) {
      throw new Error('pnpm-workspace.yaml should not be removed')
    }

    // Verify configs are at root
    const prettierrcPath = path.join(testDir, '.prettierrc')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(prettierrcPath)) {
      throw new Error('Root .prettierrc should be created')
    }

    console.log('  ✅ pnpm workspaces configuration works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test Yarn workspaces configuration
 */
async function testYarnWorkspaces() {
  console.log('🔍 Testing Yarn workspaces...')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yarn-workspace-test-'))
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create Yarn workspace config (similar to npm workspaces)
    const rootPackageJson = {
      name: 'yarn-monorepo',
      version: '1.0.0',
      private: true,
      workspaces: ['packages/*'],
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create workspace packages
    const packagesDir = path.join(testDir, 'packages', 'utils')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(packagesDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(packagesDir, 'package.json'),
      JSON.stringify({ name: '@monorepo/utils', version: '1.0.0' }, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(packagesDir, 'index.js'), 'module.exports = {}')

    // Run setup
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify root configs exist
    const eslintConfigPath = path.join(testDir, 'eslint.config.cjs')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(eslintConfigPath)) {
      throw new Error('Root eslint.config.cjs should be created')
    }

    console.log('  ✅ Yarn workspaces configuration works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test Lerna monorepo configuration
 */
async function testLernaMonorepo() {
  console.log('🔍 Testing Lerna monorepo...')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lerna-test-'))
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create lerna.json
    const lernaConfig = {
      version: 'independent',
      packages: ['packages/*'],
      npmClient: 'npm',
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'lerna.json'),
      JSON.stringify(lernaConfig, null, 2)
    )

    // Create root package.json
    const rootPackageJson = {
      name: 'lerna-monorepo',
      version: '1.0.0',
      private: true,
      devDependencies: {
        lerna: '^8.0.0',
      },
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create lerna package
    const packagesDir = path.join(testDir, 'packages', 'core')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(packagesDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(packagesDir, 'package.json'),
      JSON.stringify({ name: '@monorepo/core', version: '1.0.0' }, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(packagesDir, 'index.js'), 'module.exports = {}')

    // Run setup
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify lerna.json still exists
    const lernaJsonPath = path.join(testDir, 'lerna.json')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(lernaJsonPath)) {
      throw new Error('lerna.json should not be removed')
    }

    // Verify configs are at root
    const editorconfigPath = path.join(testDir, '.editorconfig')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(editorconfigPath)) {
      throw new Error('Root .editorconfig should be created')
    }

    console.log('  ✅ Lerna monorepo configuration works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test nested package.json handling
 */
async function testNestedPackageJson() {
  console.log('🔍 Testing nested package.json files...')

  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nested-package-test-'))
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create root package.json
    const rootPackageJson = {
      name: 'root-project',
      version: '1.0.0',
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create nested directory with its own package.json
    const nestedDir = path.join(testDir, 'nested', 'project')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(nestedDir, { recursive: true })

    const nestedPackageJson = {
      name: 'nested-project',
      version: '1.0.0',
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(nestedDir, 'package.json'),
      JSON.stringify(nestedPackageJson, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(nestedDir, 'index.js'), 'module.exports = {}')

    // Run setup at root
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify configs at root
    const rootPrettierPath = path.join(testDir, '.prettierrc')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(rootPrettierPath)) {
      throw new Error('Root .prettierrc should be created')
    }

    // Verify nested directory doesn't get its own configs
    const nestedPrettierPath = path.join(nestedDir, '.prettierrc')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(nestedPrettierPath)) {
      throw new Error('Nested directory should not get duplicate configs')
    }

    console.log('  ✅ Nested package.json handling works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test setup run from within a workspace package
 */
async function testWorkspacePackageSetup() {
  console.log('🔍 Testing setup from workspace package directory...')

  const testDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'workspace-package-setup-test-')
  )
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create workspace structure
    const rootPackageJson = {
      name: 'workspace-root',
      version: '1.0.0',
      private: true,
      workspaces: ['packages/*'],
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    const workspaceDir = path.join(testDir, 'packages', 'web')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(workspaceDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(workspaceDir, 'package.json'),
      JSON.stringify({ name: '@workspace/web', version: '1.0.0' }, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(workspaceDir, 'index.js'), 'module.exports = {}')

    // Run setup FROM workspace package directory (not root)
    execSync(`node "${setupPath}"`, { cwd: workspaceDir, stdio: 'pipe' })

    // Verify configs were created at workspace package level
    // (Since we're in a git repo but in a subdirectory with package.json,
    // it should treat it as the project root)
    const workspacePrettierPath = path.join(workspaceDir, '.prettierrc')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(workspacePrettierPath)) {
      throw new Error('Workspace package should get its own configs')
    }

    console.log('  ✅ Setup from workspace package directory works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

/**
 * Test mixed JavaScript + Python monorepo
 */
async function testMixedLanguageMonorepo() {
  console.log('🔍 Testing mixed JS+Python monorepo...')

  const testDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mixed-lang-monorepo-test-')
  )
  const setupPath = path.join(__dirname, '..', 'setup.js')

  try {
    execSync('git init', { cwd: testDir, stdio: 'ignore' })
    execSync('git config user.email "test@example.com"', {
      cwd: testDir,
      stdio: 'ignore',
    })
    execSync('git config user.name "Test User"', {
      cwd: testDir,
      stdio: 'ignore',
    })

    // Create workspace structure
    const rootPackageJson = {
      name: 'mixed-monorepo',
      version: '1.0.0',
      private: true,
      workspaces: ['packages/*'],
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(rootPackageJson, null, 2)
    )

    // Create JavaScript package
    const jsPackageDir = path.join(testDir, 'packages', 'js-app')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(jsPackageDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(jsPackageDir, 'package.json'),
      JSON.stringify({ name: '@monorepo/js-app', version: '1.0.0' }, null, 2)
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(jsPackageDir, 'index.js'),
      'console.log("JS app")'
    )

    // Create Python package
    const pyPackageDir = path.join(testDir, 'packages', 'py-lib')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(pyPackageDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(pyPackageDir, '__init__.py'),
      'print("Python lib")'
    )

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(pyPackageDir, 'main.py'),
      'def main():\n    pass'
    )

    // Run setup
    execSync(`node "${setupPath}"`, { cwd: testDir, stdio: 'pipe' })

    // Verify both JS and Python configs at root
    const expectedFiles = [
      '.prettierrc',
      'eslint.config.cjs',
      'pyproject.toml',
      '.pre-commit-config.yaml',
    ]

    for (const file of expectedFiles) {
      const filePath = path.join(testDir, file)
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Expected ${file} for mixed language monorepo at root level`
        )
      }
    }

    // Verify package.json was updated with scripts for both languages
    const updatedPackageJson = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.readFileSync(path.join(testDir, 'package.json'), 'utf8')
    )

    if (!updatedPackageJson.scripts) {
      throw new Error('package.json should have scripts added')
    }

    // Should have JavaScript tooling scripts
    if (!updatedPackageJson.scripts.format) {
      throw new Error('Should have JavaScript format script')
    }

    // Should have Python helper scripts
    if (
      !updatedPackageJson.scripts['python:format'] &&
      !updatedPackageJson.scripts['py:format']
    ) {
      console.warn('  ⚠️ Python format script not added (acceptable)')
    }

    console.log('  ✅ Mixed JS+Python monorepo configuration works correctly')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMonorepoEdgeCases().catch(error => {
    console.error('❌ Monorepo edge case tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testMonorepoEdgeCases }
