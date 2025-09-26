'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execSync } = require('child_process')

const templateRoot = path.resolve(__dirname, '..')
const setupScript = path.join(templateRoot, 'setup.js')
const {
  defaultDevDependencies,
  defaultLintStaged,
  defaultScripts
} = require('../config/defaults')

const createTempProject = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-template-'))
  execSync('git init', { cwd: tempDir, stdio: 'ignore' })

  const packageJson = {
    name: 'fixture-project',
    version: '0.1.0',
    scripts: {
      lint: 'custom lint'
    },
    devDependencies: {
      prettier: '^2.0.0'
    },
    'lint-staged': {
      'package.json': ['custom-command']
    }
  }

  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  return { tempDir, initialPackageJson: packageJson }
}

const runSetup = cwd => {
  execSync(`node ${setupScript}`, { cwd, stdio: 'ignore' })
}

const readJson = filePath =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const expectFile = (cwd, relativePath) => {
  const target = path.join(cwd, relativePath)
  assert.ok(fs.existsSync(target), `${relativePath} should exist`)
  return target
}

const cleanup = cwd => {
  fs.rmSync(cwd, { recursive: true, force: true })
}

const { tempDir: projectDir, initialPackageJson } = createTempProject()

try {
  runSetup(projectDir)

  const pkg = readJson(path.join(projectDir, 'package.json'))

  // Scripts: existing entries remain, missing defaults are added
  Object.entries(defaultScripts).forEach(([name, command]) => {
    if (name in initialPackageJson.scripts) {
      assert.strictEqual(pkg.scripts[name], initialPackageJson.scripts[name])
    } else {
      assert.strictEqual(pkg.scripts[name], command)
    }
  })

  // Dev dependencies: preserve existing versions, add missing defaults
  Object.entries(defaultDevDependencies).forEach(([dependency, version]) => {
    if (dependency in initialPackageJson.devDependencies) {
      assert.strictEqual(
        pkg.devDependencies[dependency],
        initialPackageJson.devDependencies[dependency]
      )
    } else {
      assert.strictEqual(pkg.devDependencies[dependency], version)
    }
  })

  // lint-staged: merge commands without duplicates
  const lintStagedPkg = pkg['lint-staged']
  const expectedLintStaged = {
    ...defaultLintStaged,
    'package.json': [
      ...initialPackageJson['lint-staged']['package.json'],
      ...defaultLintStaged['package.json']
    ]
  }

  Object.entries(expectedLintStaged).forEach(([pattern, commands]) => {
    const value = lintStagedPkg[pattern]
    assert.ok(Array.isArray(value), `${pattern} should be an array`)
    const sortedActual = [...new Set(value)].sort()
    const sortedExpected = [...new Set(commands)].sort()
    assert.deepStrictEqual(sortedActual, sortedExpected)
  })

  // Template files copied
  expectFile(projectDir, '.prettierrc')
  expectFile(projectDir, '.eslintrc.json')
  expectFile(projectDir, '.stylelintrc.json')
  expectFile(projectDir, '.prettierignore')
  expectFile(projectDir, '.eslintignore')
  expectFile(projectDir, '.github/workflows/quality.yml')

  // Husky hook generated
  expectFile(projectDir, '.husky/pre-commit')
} finally {
  cleanup(projectDir)
}

