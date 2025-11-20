'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const { TemplateLoader } = require('../lib/template-loader')

/**
 * Tests for custom template loading functionality
 */
async function testTemplateLoader() {
  console.log('🧪 Testing custom template loader...\n')

  await testTemplatePathValidation()
  await testTemplateStructureValidation()
  await testTemplateLoading()
  await testPartialTemplateOverride()
  await testInvalidTemplateFallback()
  await testTemplateFileMerging()

  console.log('\n✅ All template loader tests passed!\n')
}

/**
 * Test template path validation
 */
async function testTemplatePathValidation() {
  console.log('🔍 Testing template path validation...')

  const loader = new TemplateLoader()

  // Test 1: Null/undefined path should be invalid
  if (loader.isValidTemplatePath(null)) {
    throw new Error('Null path should be invalid')
  }

  if (loader.isValidTemplatePath(undefined)) {
    throw new Error('Undefined path should be invalid')
  }

  // Test 2: Non-existent directory should be invalid
  if (loader.isValidTemplatePath('/nonexistent/path/to/templates')) {
    throw new Error('Non-existent path should be invalid')
  }

  // Test 3: File (not directory) should be invalid
  const testFile = path.join(os.tmpdir(), 'test-file.txt')
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(testFile, 'test')
  try {
    if (loader.isValidTemplatePath(testFile)) {
      throw new Error('File path should be invalid (must be directory)')
    }
  } finally {
    fs.unlinkSync(testFile)
  }

  // Test 4: Valid directory should be valid
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-test-'))
  try {
    if (!loader.isValidTemplatePath(testDir)) {
      throw new Error('Valid directory should be valid')
    }
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }

  // Test 5: Directory with special characters should be valid
  const specialCharDir = path.join(os.tmpdir(), 'template-test-special-&-chars')
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.mkdirSync(specialCharDir)
  try {
    if (!loader.isValidTemplatePath(specialCharDir)) {
      throw new Error(
        'Directory with special characters (&) should be valid for file paths'
      )
    }
  } finally {
    fs.rmSync(specialCharDir, { recursive: true, force: true })
  }

  console.log('  ✅ Template path validation works correctly')
}

/**
 * Test template structure validation
 */
async function testTemplateStructureValidation() {
  console.log('🔍 Testing template structure validation...')

  const loader = new TemplateLoader()

  // Test 1: Empty directory should be valid (partial template)
  const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-template-'))
  try {
    const isValid = await loader.validateTemplateStructure(emptyDir)
    if (!isValid) {
      throw new Error('Empty directory should be valid (partial template)')
    }
  } finally {
    fs.rmSync(emptyDir, { recursive: true, force: true })
  }

  // Test 2: Directory with config files should be valid
  const validDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valid-template-'))
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(validDir, '.prettierrc'), '{}')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(validDir, 'eslint.config.cjs'),
      'module.exports = {}'
    )

    const isValid = await loader.validateTemplateStructure(validDir)
    if (!isValid) {
      throw new Error('Directory with config files should be valid')
    }
  } finally {
    fs.rmSync(validDir, { recursive: true, force: true })
  }

  // Test 3: Directory with non-config files should still be valid
  const mixedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mixed-template-'))
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(mixedDir, 'README.md'), '# Template')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(mixedDir, 'random.txt'), 'content')

    const isValid = await loader.validateTemplateStructure(mixedDir)
    if (!isValid) {
      throw new Error('Directory with mixed files should be valid')
    }
  } finally {
    fs.rmSync(mixedDir, { recursive: true, force: true })
  }

  console.log('  ✅ Template structure validation works correctly')
}

/**
 * Test template loading from directory
 */
async function testTemplateLoading() {
  console.log('🔍 Testing template loading...')

  const loader = new TemplateLoader()

  // Create template directory with sample files
  const templateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-template-'))

  try {
    const prettierConfig = { semi: false, singleQuote: true }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(templateDir, '.prettierrc'),
      JSON.stringify(prettierConfig, null, 2)
    )

    const eslintConfig = 'module.exports = { rules: { "no-console": "warn" } }'
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(templateDir, 'eslint.config.cjs'), eslintConfig)

    // Load template
    const templates = await loader.loadTemplates(templateDir)

    // Verify loaded templates
    if (!templates['.prettierrc']) {
      throw new Error('Should load .prettierrc from template')
    }

    if (!templates['eslint.config.cjs']) {
      throw new Error('Should load eslint.config.cjs from template')
    }

    // Verify content
    const loadedPrettier = JSON.parse(templates['.prettierrc'])
    if (loadedPrettier.semi !== false || loadedPrettier.singleQuote !== true) {
      throw new Error('Loaded template content should match original')
    }

    console.log('  ✅ Template loading works correctly')
  } finally {
    fs.rmSync(templateDir, { recursive: true, force: true })
  }
}

/**
 * Test partial template override (some files from template, others from defaults)
 */
async function testPartialTemplateOverride() {
  console.log('🔍 Testing partial template override...')

  const loader = new TemplateLoader()

  // Create partial template (only .prettierrc)
  const templateDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'partial-template-')
  )

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(templateDir, '.prettierrc'), '{"semi": false}')

    // Create default templates directory
    const defaultsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'defaults-template-')
    )

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(path.join(defaultsDir, '.prettierrc'), '{"semi": true}')
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(
        path.join(defaultsDir, 'eslint.config.cjs'),
        'module.exports = {}'
      )

      // Load and merge templates
      const merged = await loader.mergeTemplates(templateDir, defaultsDir)

      // Verify .prettierrc came from custom template
      const prettierConfig = JSON.parse(merged['.prettierrc'])
      if (prettierConfig.semi !== false) {
        throw new Error('Custom template should override default .prettierrc')
      }

      // Verify eslint.config.cjs came from defaults
      if (!merged['eslint.config.cjs']) {
        throw new Error('Should include eslint.config.cjs from defaults')
      }

      console.log('  ✅ Partial template override works correctly')
    } finally {
      fs.rmSync(defaultsDir, { recursive: true, force: true })
    }
  } finally {
    fs.rmSync(templateDir, { recursive: true, force: true })
  }
}

/**
 * Test fallback to defaults when template is invalid
 */
async function testInvalidTemplateFallback() {
  console.log('🔍 Testing invalid template fallback...')

  const loader = new TemplateLoader()

  // Test with non-existent directory
  const defaultsDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'fallback-defaults-')
  )

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(path.join(defaultsDir, '.prettierrc'), '{"semi": true}')

    const merged = await loader.mergeTemplates(
      '/nonexistent/template',
      defaultsDir
    )

    // Should fall back to defaults
    if (!merged['.prettierrc']) {
      throw new Error('Should fall back to defaults when template is invalid')
    }

    const prettierConfig = JSON.parse(merged['.prettierrc'])
    if (prettierConfig.semi !== true) {
      throw new Error('Should use default config when template is invalid')
    }

    console.log('  ✅ Invalid template fallback works correctly')
  } finally {
    fs.rmSync(defaultsDir, { recursive: true, force: true })
  }
}

/**
 * Test template file merging with nested directories
 */
async function testTemplateFileMerging() {
  console.log('🔍 Testing template file merging with nested directories...')

  const loader = new TemplateLoader()

  // Create template with nested structure
  const templateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nested-template-'))

  try {
    // Create .github/workflows directory
    const workflowDir = path.join(templateDir, '.github', 'workflows')
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(workflowDir, { recursive: true })

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(
      path.join(workflowDir, 'quality.yml'),
      'name: Custom Quality'
    )

    // Load templates
    const templates = await loader.loadTemplates(templateDir)

    // Verify nested file is loaded with correct path
    const nestedPath = path.join('.github', 'workflows', 'quality.yml')
    if (!templates[nestedPath]) {
      throw new Error('Should load nested files from template')
    }

    if (templates[nestedPath] !== 'name: Custom Quality') {
      throw new Error('Nested file content should match')
    }

    console.log(
      '  ✅ Template file merging with nested directories works correctly'
    )
  } finally {
    fs.rmSync(templateDir, { recursive: true, force: true })
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testTemplateLoader().catch(error => {
    console.error('❌ Template loader tests failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testTemplateLoader }
